import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/vouchers/[id] - get single voucher (admin only)
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid voucher ID" }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("vouchers")
      .select("id, code, qr_code, barcode, title, description, status, expires_at, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/vouchers/[id] - update voucher (admin only)
export async function PUT(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid voucher ID" }, { status: 400 });
    }

    const body = await request.json();
    const allowedFields = ["title", "description", "status", "expires_at"];
    const updatePayload = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "status" && !["active", "used", "expired", "revoked"].includes(body[field])) {
          return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }
        if (field === "title" && body[field].length > 200) {
          return NextResponse.json({ error: "Title max 200 chars" }, { status: 400 });
        }
        if (field === "description" && body[field].length > 500) {
          return NextResponse.json({ error: "Description max 500 chars" }, { status: 400 });
        }
        if (field === "expires_at" && body[field] === "") {
          updatePayload[field] = null;
          continue;
        }
        updatePayload[field] = body[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("vouchers")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating voucher:", error);
      return NextResponse.json({ error: "Failed to update voucher" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/vouchers/[id] - delete voucher (admin only)
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid voucher ID" }, { status: 400 });
    }

    const db = createAdminClient();
    const { error } = await db.from("vouchers").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete voucher" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Voucher deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
