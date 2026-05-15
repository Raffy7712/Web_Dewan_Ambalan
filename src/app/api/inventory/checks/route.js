import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/inventory/checks?item_id=xxx - get check logs for item
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("item_id");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    if (!itemId) {
      return NextResponse.json(
        { error: "item_id is required" },
        { status: 400 }
      );
    }

    if (!UUID_RE.test(itemId)) {
      return NextResponse.json(
        { error: "Invalid item_id format" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data, count, error } = await db
      .from("item_checks")
      .select("*", { count: "exact" })
      .eq("item_id", itemId)
      .order("check_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching item checks:", error);
      return NextResponse.json(
        { error: "Failed to fetch item checks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      checks: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/checks - create check log (admin only)
export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { item_id, condition, notes, requires_maintenance = false } = body;

    if (!item_id || !condition) {
      return NextResponse.json(
        { error: "item_id and condition are required" },
        { status: 400 }
      );
    }

    if (!UUID_RE.test(item_id)) {
      return NextResponse.json(
        { error: "Invalid item_id format" },
        { status: 400 }
      );
    }

    if (!["baik", "perlu_perbaikan", "rusak"].includes(condition)) {
      return NextResponse.json(
        { error: "Invalid condition value" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // Verify item exists
    const { data: item, error: itemError } = await db
      .from("inventory_items")
      .select("id")
      .eq("id", item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const insertPayload = {
      item_id,
      condition,
      checked_by: auth.id,
      requires_maintenance: Boolean(requires_maintenance),
    };
    if (notes) insertPayload.notes = notes;

    // Create check log and update item's last_checked
    const { data, error } = await db
      .from("item_checks")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating check log:", error);
      return NextResponse.json(
        { error: "Failed to create check log" },
        { status: 500 }
      );
    }

    // Update item's condition and last_checked
    await db
      .from("inventory_items")
      .update({
        condition,
        last_checked: new Date().toISOString(),
        last_checked_by: auth.id,
      })
      .eq("id", item_id);

    return NextResponse.json({
      ok: true,
      check: data,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
