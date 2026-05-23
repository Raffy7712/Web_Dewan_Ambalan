import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    // Try to find as voucher first
    let item = null;
    let itemType = null;

    const voucherResult = await query(
      `SELECT * FROM vouchers WHERE kode = $1`,
      [code]
    );

    if (voucherResult.rows.length > 0) {
      item = voucherResult.rows[0];
      itemType = "voucher";
    } else {
      // Try certificate
      const certResult = await query(
        `SELECT * FROM certificates WHERE kode = $1`,
        [code]
      );

      if (certResult.rows.length > 0) {
        item = certResult.rows[0];
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
      } else if (item.kadaluarsa && new Date(item.kadaluarsa) < new Date()) {
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
    const metadata = JSON.stringify({
      userAgent: request.headers.get("user-agent"),
    });

    if (itemType === "voucher") {
      await query(
        `INSERT INTO verification_scans (scanned_at, verification_type, voucher_id, metadata)
         VALUES (NOW(), $1, $2, $3)`,
        [verification_type, item.id, metadata]
      );
    } else {
      await query(
        `INSERT INTO verification_scans (scanned_at, verification_type, certificate_id, metadata)
         VALUES (NOW(), $1, $2, $3)`,
        [verification_type, item.id, metadata]
      );
    }

    return NextResponse.json({
      ok: true,
      valid: isValid,
      message: validationMessage,
      type: itemType,
      item: {
        id: item.id,
        code: item.kode,
        title: item.judul || item.jenis_sertifikat,
        description: item.keterangan || null,
        status: item.status,
        ...(itemType === "voucher" && { expires_at: item.kadaluarsa }),
        ...(itemType === "certificate" && {
          recipient_name: item.nama_penerima,
          issue_date: item.issue_date,
        }),
      },
    });
  } catch (err) {
    console.error("Error in voucher/certificate verification:", err);
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

    // Find item
    let item = null;
    let itemType = null;

    const voucherResult = await query(
      `SELECT * FROM vouchers WHERE kode = $1`,
      [code]
    );

    if (voucherResult.rows.length > 0) {
      item = voucherResult.rows[0];
      itemType = "voucher";
    } else {
      const certResult = await query(
        `SELECT * FROM certificates WHERE kode = $1`,
        [code]
      );

      if (certResult.rows.length > 0) {
        item = certResult.rows[0];
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
    const foreignKey = itemType === "voucher" ? "voucher_id" : "certificate_id";
    const scansResult = await query(
      `SELECT * FROM verification_scans WHERE ${foreignKey} = $1 ORDER BY scanned_at DESC`,
      [item.id]
    );

    return NextResponse.json({
      ok: true,
      type: itemType,
      item,
      scan_history: scansResult.rows || [],
      total_scans: scansResult.rows?.length || 0,
    });
  } catch (err) {
    console.error("Error fetching voucher/certificate details:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
