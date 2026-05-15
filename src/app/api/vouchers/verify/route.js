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
    const { code, verification_type = "code" } = body;

    if (!code || typeof code !== "string" || code.length > 50) {
      return NextResponse.json(
        { error: "code is required (max 50 chars)" },
        { status: 400 },
      );
    }

    if (!["qr", "barcode", "code"].includes(verification_type)) {
      return NextResponse.json(
        { error: "Invalid verification_type" },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    // Try to find as voucher first — select only needed columns
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
      // Try certificate
      const { data: certData } = await db
        .from("certificates")
        .select("id, code, certificate_type, recipient_name, status, issue_date")
        .eq("code", code)
        .single();

      if (certData) {
        item = certData;
        itemType = "certificate";
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
        validationMessage = "Sertifikat valid";
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
          recipient_name: item.recipient_name,
          issue_date: item.issue_date,
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
        .select("id, code, certificate_type, recipient_name, status, issue_date")
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
