import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, title, description, expires_at, quantity = 1 } = body;

    if (!type || !["voucher", "certificate"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'voucher' or 'certificate'" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    const generated = [];

    for (let i = 0; i < quantity; i++) {
      // Generate unique code: e.g., VCH-2025-0001, CERT-2025-0001
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${type === "voucher" ? "VCH" : "CERT"}-${new Date().getFullYear()}-${random}`;

      // Generate QR code data (will be encoded as JSON string)
      const qrData = JSON.stringify({
        type,
        code,
        title,
        generatedAt: new Date().toISOString(),
      });

      // Prepare barcode (simplified: just use code for now)
      const barcode = code;

      const table = type === "voucher" ? "vouchers" : "certificates";

      if (type === "voucher") {
        const { data, error } = await db
          .from("vouchers")
          .insert({
            code,
            qr_code: qrData,
            barcode,
            title,
            description,
            expires_at,
            status: "active",
          })
          .select()
          .single();

        if (error) {
          console.error(`Error creating ${type}:`, error);
          return NextResponse.json(
            { error: `Failed to create ${type}: ${error.message}` },
            { status: 500 }
          );
        }

        generated.push(data);
      } else {
        const { recipient_name, certificate_type, dewan_ambalan } = body;
        if (!recipient_name || !certificate_type) {
          return NextResponse.json(
            { error: "recipient_name and certificate_type are required for certificates" },
            { status: 400 }
          );
        }

        const { data, error } = await db
          .from("certificates")
          .insert({
            code,
            qr_code: qrData,
            barcode,
            recipient_name,
            certificate_type,
            dewan_ambalan: dewan_ambalan || "Dewan Ambalan",
            status: "issued",
          })
          .select()
          .single();

        if (error) {
          console.error(`Error creating ${type}:`, error);
          return NextResponse.json(
            { error: `Failed to create ${type}: ${error.message}` },
            { status: 500 }
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
      { status: 500 }
    );
  }
}
