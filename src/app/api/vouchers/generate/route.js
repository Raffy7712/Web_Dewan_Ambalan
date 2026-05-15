import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// POST /api/vouchers/generate - generate voucher/certificate (admin only)
export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { type, title, description, expires_at, quantity = 1 } = body;

    if (!type || !["voucher", "certificate"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'voucher' or 'certificate'" },
        { status: 400 }
      );
    }

    // For vouchers, title is required; for certificates it's optional
    if (type === "voucher" && (!title || title.length > 200)) {
      return NextResponse.json(
        { error: "title is required for vouchers (max 200 chars)" },
        { status: 400 }
      );
    }

    // Validate expires_at for vouchers
    if (type === "voucher" && expires_at) {
      const d = new Date(expires_at);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid expires_at date" },
          { status: 400 },
        );
      }
    }

    // Cap quantity to prevent abuse
    const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 25);

    const db = createAdminClient();
    const generated = [];
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://da-alf.web.id";

    for (let i = 0; i < qty; i++) {
      // Use crypto.randomBytes for cryptographically secure random code
      const random = crypto.randomBytes(4).toString("hex").toUpperCase();
      const code = `${type === "voucher" ? "VCH" : "CERT"}-${new Date().getFullYear()}-${random}`;

      // QR code encodes the verification URL for easy scanning
      const verifyUrl = `${BASE_URL}/vouchers?code=${code}`;

      if (type === "voucher") {
        const qrData = JSON.stringify({
          type: "voucher",
          code,
          title,
          verifyUrl,
          generatedAt: new Date().toISOString(),
        });

        const insertPayload = {
          code,
          qr_code: qrData,
          barcode: code,
          title,
          status: "active",
        };
        if (description) insertPayload.description = String(description).slice(0, 500);
        if (expires_at) insertPayload.expires_at = new Date(expires_at).toISOString();

        const { data, error } = await db
          .from("vouchers")
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.error("Error creating voucher:", error.message);
          return NextResponse.json(
            { error: "Failed to create voucher" },
            { status: 500 },
          );
        }

        generated.push(data);
      } else {
        const { recipient_name, certificate_type, dewan_ambalan, nomor_sertifikat } = body;
        if (!recipient_name || !certificate_type) {
          return NextResponse.json(
            { error: "recipient_name dan certificate_type wajib diisi untuk sertifikat" },
            { status: 400 },
          );
        }

        const qrData = JSON.stringify({
          type: "certificate",
          code,
          nomor_sertifikat: nomor_sertifikat || null,
          recipient_name,
          certificate_type,
          dewan_ambalan: dewan_ambalan || "Dewan Ambalan",
          verifyUrl,
          generatedAt: new Date().toISOString(),
        });

        const insertPayload = {
          code,
          qr_code: qrData,
          barcode: code,
          recipient_name: String(recipient_name).slice(0, 200),
          certificate_type,
          dewan_ambalan: dewan_ambalan || "Dewan Ambalan",
          status: "issued",
        };

        // Add nomor_sertifikat if provided
        if (nomor_sertifikat) {
          insertPayload.nomor_sertifikat = String(nomor_sertifikat).slice(0, 100);
        }

        const { data, error } = await db
          .from("certificates")
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.error("Error creating certificate:", error.message);
          return NextResponse.json(
            { error: "Failed to create certificate: " + error.message },
            { status: 500 },
          );
        }

        generated.push(data);
      }
    }

    return NextResponse.json({
      ok: true,
      type,
      count: generated.length,
      items: generated,
    });
  } catch (error) {
    console.error("Error in voucher/certificate generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
