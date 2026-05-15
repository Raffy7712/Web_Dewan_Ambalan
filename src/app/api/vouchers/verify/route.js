import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";
import { rateLimitConsume, rateLimitMessage } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/request-ip";

// POST /api/vouchers/verify - public verification endpoint (rate-limited)
export async function POST(request) {
  try {
    // Rate limit: 30 verifications per IP per minute
    const ip = getClientIpFromHeaders(request.headers);
    const rl = rateLimitConsume(`voucher-verify:${ip}`, 30, 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: rateLimitMessage(rl.retryAfterMs) },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { code, nomor_sertifikat, verification_type = "code" } = body;

    if ((!code && !nomor_sertifikat) || (code && typeof code !== "string") || (nomor_sertifikat && typeof nomor_sertifikat !== "string")) {
      return NextResponse.json(
        { error: "code atau nomor_sertifikat diperlukan" },
        { status: 400 },
      );
    }

    if (code && code.length > 50) {
      return NextResponse.json(
        { error: "code max 50 chars" },
        { status: 400 },
      );
    }

    if (nomor_sertifikat && nomor_sertifikat.length > 100) {
      return NextResponse.json(
        { error: "nomor_sertifikat max 100 chars" },
        { status: 400 },
      );
    }

    if (!["qr", "barcode", "code", "nomor_surat"].includes(verification_type)) {
      return NextResponse.json(
        { error: "Invalid verification_type" },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    // Jika verifikasi via nomor_sertifikat, langsung cari di certificates
    let item = null;
    let itemType = null;

    if (nomor_sertifikat) {
      // Verifikasi via nomor surat — hanya untuk sertifikat
      const { data: certData } = await db
        .from("certificates")
        .select("id, code, nomor_sertifikat, certificate_type, recipient_name, dewan_ambalan, status, issue_date, description, issuer_detail")
        .eq("nomor_sertifikat", nomor_sertifikat)
        .single();

      if (certData) {
        item = certData;
        itemType = "certificate";
      }
    } else {
      // Verifikasi via code — cek voucher dulu, lalu sertifikat
      const { data: voucherData } = await db
        .from("vouchers")
        .select("id, code, title, description, status, expires_at")
        .eq("code", code)
        .single();

      if (voucherData) {
        item = voucherData;
        itemType = "voucher";
      } else {
        const { data: certData } = await db
          .from("certificates")
          .select("id, code, nomor_sertifikat, certificate_type, recipient_name, dewan_ambalan, status, issue_date, description, issuer_detail")
          .eq("code", code)
          .single();

        if (certData) {
          item = certData;
          itemType = "certificate";
        }
      }
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found", valid: false },
        { status: 404 },
      );
    }

    // Check validity
    let isValid = true;
    let validationMessage = "";

    if (itemType === "voucher") {
      if (item.status === "expired") {
        isValid = false;
        validationMessage = "Voucher sudah expired";
      } else if (item.status === "used") {
        isValid = false;
        validationMessage = "Voucher sudah digunakan";
      } else if (item.status === "revoked") {
        isValid = false;
        validationMessage = "Voucher telah dibatalkan";
      } else if (item.expires_at && new Date(item.expires_at) < new Date()) {
        isValid = false;
        validationMessage = "Voucher sudah melewati tanggal kadaluarsa";
      } else {
        validationMessage = "Voucher valid";
      }
    } else {
      if (item.status === "revoked") {
        isValid = false;
        validationMessage = "Sertifikat telah dibatalkan";
      } else {
        validationMessage = "Sertifikat valid — diterbitkan oleh " + (item.dewan_ambalan || "Dewan Ambalan");
      }
    }

    // Record the scan (non-blocking)
    const scanPayload = {
      scanned_at: new Date().toISOString(),
      verification_type,
      metadata: {},
    };
    if (itemType === "voucher") scanPayload.voucher_id = item.id;
    if (itemType === "certificate") scanPayload.certificate_id = item.id;

    db.from("verification_scans").insert(scanPayload).catch(() => {});

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
          description: item.description || null,
          issuer_detail: item.issuer_detail || null,
        }),
      },
    });
  } catch (error) {
    console.error("Error in voucher/certificate verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/vouchers/verify?code=xxx - get scan history (admin only)
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "code query parameter is required" },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    // Find item — select only needed columns
    let item = null;
    let itemType = null;

    const { data: voucherData } = await db
      .from("vouchers")
      .select("id, code, title, description, status, expires_at")
      .eq("code", code)
      .single();

    if (voucherData) {
      item = voucherData;
      itemType = "voucher";
    } else {
      const { data: certData } = await db
        .from("certificates")
        .select("id, code, nomor_sertifikat, certificate_type, recipient_name, status, issue_date")
        .eq("code", code)
        .single();

      if (certData) {
        item = certData;
        itemType = "certificate";
      }
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 },
      );
    }

    // Get scan history
    const { data: scans } = await db
      .from("verification_scans")
      .select("id, scanned_at, verification_type")
      .eq(
        itemType === "voucher" ? "voucher_id" : "certificate_id",
        item.id,
      )
      .order("scanned_at", { ascending: false });

    return NextResponse.json({
      ok: true,
      type: itemType,
      item,
      scan_history: scans || [],
      total_scans: scans?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching voucher/certificate details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
