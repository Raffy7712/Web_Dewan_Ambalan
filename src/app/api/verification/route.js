import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Helper: create Supabase admin client inline (avoid module-level side effects) ──
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL atau Service Role Key belum diset di environment.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Simple in-memory rate limiter ──
const buckets = new Map();
function rateLimitConsume(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    const oldest = arr[0];
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true };
}

function rateLimitMessage(retryAfterMs) {
  const sec = Math.ceil((retryAfterMs ?? 60000) / 1000);
  return sec >= 120
    ? `Terlalu banyak permintaan. Coba lagi sekitar ${Math.ceil(sec / 60)} menit lagi.`
    : `Terlalu banyak permintaan. Coba lagi dalam ${sec} detik.`;
}

// POST /api/verification — public verification (rate-limited)
export async function POST(request) {
  try {
    // ── Rate limit ──
    let ip = "unknown";
    try {
      const h = request.headers;
      if (h) {
        const vff = h.get("x-vercel-forwarded-for");
        if (vff) { ip = vff.split(",")[0]?.trim() || "unknown"; }
        else {
          const real = h.get("x-real-ip")?.trim();
          if (real) ip = real;
          else {
            const xff = h.get("x-forwarded-for");
            if (xff) ip = xff.split(",")[0]?.trim() || "unknown";
          }
        }
      }
    } catch { ip = "unknown"; }

    const rl = rateLimitConsume(`verification:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: rateLimitMessage(rl.retryAfterMs) }, { status: 429 });
    }

    // ── Parse body ──
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

    const { code, nomor_sertifikat, verification_type = "code" } = body;

    if ((!code && !nomor_sertifikat) || (code && typeof code !== "string") || (nomor_sertifikat && typeof nomor_sertifikat !== "string")) {
      return NextResponse.json({ error: "code atau nomor_sertifikat diperlukan" }, { status: 400 });
    }
    if (code && code.length > 50) {
      return NextResponse.json({ error: "code max 50 chars" }, { status: 400 });
    }
    if (nomor_sertifikat && nomor_sertifikat.length > 100) {
      return NextResponse.json({ error: "nomor_sertifikat max 100 chars" }, { status: 400 });
    }
    if (!["qr", "barcode", "code", "nomor_surat"].includes(verification_type)) {
      return NextResponse.json({ error: "Invalid verification_type" }, { status: 400 });
    }

    // ── DB client ──
    let db;
    try { db = getAdminClient(); }
    catch (dbErr) {
      console.error("Failed to create Supabase client:", dbErr.message);
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    // ── Query ──
    let item = null;
    let itemType = null;

    if (nomor_sertifikat) {
      const { data: certData, error: certErr } = await db
        .from("certificates")
        .select("id, code, nomor_sertifikat, certificate_type, recipient_name, dewan_ambalan, status, issue_date, description")
        .eq("nomor_sertifikat", nomor_sertifikat)
        .maybeSingle();

      if (certErr) console.error("Cert by nomor_sertifikat error:", certErr.message);
      if (certData) { item = certData; itemType = "certificate"; }
    } else {
      // Cek voucher dulu
      const { data: voucherData, error: vouchErr } = await db
        .from("vouchers")
        .select("id, code, title, description, status, expires_at")
        .eq("code", code)
        .maybeSingle();

      if (vouchErr) console.error("Voucher query error:", vouchErr.message);

      if (voucherData) { item = voucherData; itemType = "voucher"; }
      else {
        const { data: certData, error: certErr } = await db
          .from("certificates")
          .select("id, code, nomor_sertifikat, certificate_type, recipient_name, dewan_ambalan, status, issue_date, description")
          .eq("code", code)
          .maybeSingle();

        if (certErr) console.error("Cert by code error:", certErr.message);
        if (certData) { item = certData; itemType = "certificate"; }
      }
    }

    if (!item) {
      return NextResponse.json({ error: "Tidak ditemukan", valid: false }, { status: 404 });
    }

    // ── Check validity ──
    let isValid = true;
    let validationMessage = "";

    if (itemType === "voucher") {
      if (item.status === "expired") { isValid = false; validationMessage = "Voucher sudah expired"; }
      else if (item.status === "used") { isValid = false; validationMessage = "Voucher sudah digunakan"; }
      else if (item.status === "revoked") { isValid = false; validationMessage = "Voucher telah dibatalkan"; }
      else if (item.expires_at && new Date(item.expires_at) < new Date()) { isValid = false; validationMessage = "Voucher sudah melewati tanggal kadaluarsa"; }
      else { validationMessage = "Voucher valid"; }
    } else {
      if (item.status === "revoked") { isValid = false; validationMessage = "Sertifikat telah dibatalkan"; }
      else { validationMessage = "Sertifikat valid — diterbitkan oleh " + (item.dewan_ambalan || "Dewan Ambalan"); }
    }

    // ── Record scan (fire-and-forget) ──
    try {
      const scanPayload = {
        scanned_at: new Date().toISOString(),
        verification_type,
        metadata: {},
      };
      if (itemType === "voucher") scanPayload.voucher_id = item.id;
      if (itemType === "certificate") scanPayload.certificate_id = item.id;

      db.from("verification_scans").insert(scanPayload).then(() => {}).catch(() => {});
    } catch { /* Don't let scan recording affect response */ }

    return NextResponse.json({
      ok: true,
      valid: isValid,
      message: validationMessage,
      type: itemType,
      item: {
        code: item.code,
        title: item.title || item.certificate_type,
        description: item.description || null,
        status: item.status,
        ...(itemType === "voucher" && { expires_at: item.expires_at }),
        ...(itemType === "certificate" && {
          nomor_sertifikat: item.nomor_sertifikat || null,
          recipient_name: item.recipient_name,
          certificate_type: item.certificate_type,
          dewan_ambalan: item.dewan_ambalan || null,
          issue_date: item.issue_date,
        }),
      },
    });
  } catch (error) {
    console.error("Error in POST /api/verification:", error?.message || error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

// GET /api/verification?code=xxx — scan history (admin only)
export async function GET(request) {
  try {
    // Inline admin check (avoid importing auth-session which has module-level side effects)
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const token = jar.get("da_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify JWT
    let session;
    try {
      const { jwtVerify } = await import("jose");
      const secret = process.env.AUTH_SECRET;
      if (!secret) throw new Error("AUTH_SECRET not set");
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
        issuer: "da-alf",
        audience: "da-alf-web",
      });
      session = payload;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "code query parameter is required" }, { status: 400 });
    }

    let db;
    try { db = getAdminClient(); }
    catch (dbErr) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    let item = null;
    let itemType = null;

    const { data: voucherData } = await db
      .from("vouchers")
      .select("id, code, title, description, status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (voucherData) { item = voucherData; itemType = "voucher"; }
    else {
      const { data: certData } = await db
        .from("certificates")
        .select("id, code, nomor_sertifikat, certificate_type, recipient_name, status, issue_date, description")
        .eq("code", code)
        .maybeSingle();

      if (certData) { item = certData; itemType = "certificate"; }
    }

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { data: scans } = await db
      .from("verification_scans")
      .select("id, scanned_at, verification_type")
      .eq(itemType === "voucher" ? "voucher_id" : "certificate_id", item.id)
      .order("scanned_at", { ascending: false });

    return NextResponse.json({
      ok: true,
      type: itemType,
      item,
      scan_history: scans || [],
      total_scans: scans?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/verification:", error?.message || error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
