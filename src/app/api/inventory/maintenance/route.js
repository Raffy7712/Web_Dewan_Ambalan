import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/inventory/maintenance?item_id=xxx - get maintenance logs for item
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("item_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!itemId) {
      return NextResponse.json(
        { error: "item_id is required" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data, count, error } = await db
      .from("maintenance_logs")
      .select("*", { count: "exact" })
      .eq("item_id", itemId)
      .order("maintenance_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching maintenance logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch maintenance logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      logs: data || [],
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

// POST /api/inventory/maintenance - create maintenance log
export async function POST(request) {
  try {
    const body = await request.json();
    const { item_id, maintenance_type, description, cost, notes } = body;

    if (!item_id || !maintenance_type) {
      return NextResponse.json(
        { error: "item_id and maintenance_type are required" },
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

    const { data, error } = await db
      .from("maintenance_logs")
      .insert({
        item_id,
        maintenance_type,
        description,
        cost,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating maintenance log:", error);
      return NextResponse.json(
        { error: "Failed to create maintenance log" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      log: data,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
