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

    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "title is required (max 200 chars)" },
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

    for (let i = 0; i < qty; i++) {
      // Use crypto.randomBytes for cryptographically secure random code
      const random = crypto.randomBytes(4).toString("hex").toUpperCase();
      const code = `${type === "voucher" ? "VCH" : "CERT"}-${new Date().getFullYear()}-${random}`;

      const qrData = JSON.stringify({
        type,
        code,
        title,
        generatedAt: new Date().toISOString(),
      });

      if (type === "voucher") {
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
        const { recipient_name, certificate_type, dewan_ambalan } = body;
        if (!recipient_name || !certificate_type) {
          return NextResponse.json(
            { error: "recipient_name and certificate_type are required for certificates" },
            { status: 400 },
          );
        }

        const { data, error } = await db
          .from("certificates")
          .insert({
            code,
            qr_code: qrData,
            barcode: code,
            recipient_name: String(recipient_name).slice(0, 200),
            certificate_type,
            dewan_ambalan: dewan_ambalan || "Dewan Ambalan",
            status: "issued",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating certificate:", error.message);
          return NextResponse.json(
            { error: "Failed to create certificate" },
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
