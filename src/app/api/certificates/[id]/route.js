import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/certificates/[id] - get single certificate (admin only)
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("certificates")
      .select("id, code, qr_code, barcode, nomor_sertifikat, recipient_name, certificate_type, dewan_ambalan, status, issue_date, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/certificates/[id] - update certificate (admin only)
export async function PUT(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 });
    }

    const body = await request.json();
    const allowedFields = ["recipient_name", "certificate_type", "dewan_ambalan", "status", "nomor_sertifikat"];
    const updatePayload = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "status" && !["issued", "revoked"].includes(body[field])) {
          return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }
        if (field === "recipient_name" && body[field].length > 200) {
          return NextResponse.json({ error: "recipient_name max 200 chars" }, { status: 400 });
        }
        if (field === "nomor_sertifikat" && String(body[field]).length > 100) {
          return NextResponse.json({ error: "nomor_sertifikat max 100 chars" }, { status: 400 });
        }
        updatePayload[field] = body[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Also update the QR code data if relevant fields changed
    if (updatePayload.recipient_name || updatePayload.certificate_type || updatePayload.dewan_ambalan || updatePayload.nomor_sertifikat) {
      const db = createAdminClient();
      // Fetch current data first
      const { data: current } = await db
        .from("certificates")
        .select("code, qr_code, nomor_sertifikat, recipient_name, certificate_type, dewan_ambalan")
        .eq("id", id)
        .single();

      if (current) {
        const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://da-alf.web.id";
        const mergedData = { ...current, ...updatePayload };
        const verifyUrl = `${BASE_URL}/vouchers?code=${mergedData.code}`;
        updatePayload.qr_code = JSON.stringify({
          type: "certificate",
          code: mergedData.code,
          nomor_sertifikat: mergedData.nomor_sertifikat || null,
          recipient_name: mergedData.recipient_name,
          certificate_type: mergedData.certificate_type,
          dewan_ambalan: mergedData.dewan_ambalan || "Dewan Ambalan",
          verifyUrl,
          generatedAt: new Date().toISOString(),
        });
      }
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("certificates")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating certificate:", error);
      return NextResponse.json({ error: "Failed to update certificate" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/certificates/[id] - delete certificate (admin only)
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 });
    }

    const db = createAdminClient();
    const { error } = await db.from("certificates").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
