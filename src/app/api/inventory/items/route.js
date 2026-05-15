import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/inventory/items - list all items with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const db = createAdminClient();
    let query = db
      .from("inventory_items")
      .select(
        `
        id,
        code,
        name,
        category_id,
        inventory_categories(name),
        description,
        quantity,
        unit,
        condition,
        location,
        purchase_date,
        purchase_price,
        last_checked,
        created_at,
        updated_at
      `,
        { count: "exact" }
      );

    if (category) {
      query = query.eq("category_id", category);
    }

    if (condition) {
      query = query.eq("condition", condition);
    }

    if (search) {
      query = query.or(
        `code.ilike.%${search}%,name.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching inventory items:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: data || [],
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

// POST /api/inventory/items - create new item
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      category_id,
      description,
      quantity = 1,
      unit,
      location,
      purchase_date,
      purchase_price,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Generate code: INVT-YEAR-RANDOM
    const code = `INVT-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const db = createAdminClient();

    // Build insert payload — only include non-empty values
    const insertPayload = {
      code,
      name,
      condition: "baik",
      quantity: parseInt(quantity) || 1,
    };
    if (category_id) insertPayload.category_id = category_id;
    if (description) insertPayload.description = description;
    if (unit) insertPayload.unit = unit;
    if (location) insertPayload.location = location;
    if (purchase_date) insertPayload.purchase_date = purchase_date;
    if (purchase_price != null && purchase_price !== '')
      insertPayload.purchase_price = parseFloat(purchase_price);

    const { data, error } = await db
      .from("inventory_items")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Error creating item:", error);
      return NextResponse.json(
        { error: "Failed to create item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
