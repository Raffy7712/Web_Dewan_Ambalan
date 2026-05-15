import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, verification_type = "code" } = body;

    if (!code) {
      return NextResponse.json(
        { error: "code is required" },
        { status: 400 }
      );
    }

    if (!["qr", "barcode", "code"].includes(verification_type)) {
      return NextResponse.json(
        { error: "Invalid verification_type" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // Try to find as voucher first
    let item = null;
    let itemType = null;

    const { data: voucherData, error: voucherError } = await db
      .from("vouchers")
      .select("*")
      .eq("code", code)
      .single();

    if (!voucherError && voucherData) {
      item = voucherData;
      itemType = "voucher";
    } else {
      // Try certificate
      const { data: certData, error: certError } = await db
        .from("certificates")
        .select("*")
        .eq("code", code)
        .single();

      if (!certError && certData) {
        item = certData;
        itemType = "certificate";
      }
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found", valid: false },
        { status: 404 }
      );
    }

    // Check if expired (for vouchers only)
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

    // Record the scan in verification_scans
    const scanPayload = {
      scanned_at: new Date().toISOString(),
      verification_type,
      ...(itemType === "voucher" && { voucher_id: item.id }),
      ...(itemType === "certificate" && { certificate_id: item.id }),
      metadata: {
        userAgent: request.headers.get("user-agent"),
      },
    };

    await db.from("verification_scans").insert(scanPayload).select();

    return NextResponse.json({
      ok: true,
      valid: isValid,
      message: validationMessage,
      type: itemType,
      item: {
        id: item.id,
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
      { status: 500 }
    );
  }
}

// GET endpoint untuk lihat detail & scan history
export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "code query parameter is required" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // Find item
    let item = null;
    let itemType = null;

    const { data: voucherData } = await db
      .from("vouchers")
      .select("*")
      .eq("code", code)
      .single();

    if (voucherData) {
      item = voucherData;
      itemType = "voucher";
    } else {
      const { data: certData } = await db
        .from("certificates")
        .select("*")
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
        { status: 404 }
      );
    }

    // Get scan history
    const { data: scans } = await db
      .from("verification_scans")
      .select("*")
      .eq(
        itemType === "voucher" ? "voucher_id" : "certificate_id",
        item.id
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
      { status: 500 }
    );
  }
}
