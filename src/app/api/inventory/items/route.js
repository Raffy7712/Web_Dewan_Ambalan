import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/inventory/items - list all items with filters (admin only)
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const search = searchParams.get("search");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

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
      if (!UUID_RE.test(category)) {
        return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
      }
      query = query.eq("category_id", category);
    }

    if (condition) {
      query = query.eq("condition", condition);
    }

    if (search) {
      // Escape special ilike characters
      const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(
        `code.ilike.%${escaped}%,name.ilike.%${escaped}%,location.ilike.%${escaped}%`
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

// POST /api/inventory/items - create new item (admin only)
export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

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

    // Generate code: INVT-YEAR-RANDOM (cryptographically secure)
    const code = `INVT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const db = createAdminClient();

    // Build insert payload — only include non-empty values
    const insertPayload = {
      code,
      name,
      condition: "baik",
      quantity: parseInt(quantity) || 1,
      created_by: auth.id,
    };
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (category_id && !UUID_RE.test(category_id)) {
      return NextResponse.json(
        { error: "Invalid category_id format" },
        { status: 400 }
      );
    }
    if (category_id) insertPayload.category_id = category_id;
    if (description) insertPayload.description = description;
    if (unit) insertPayload.unit = unit;
    if (location) insertPayload.location = location;
    if (purchase_date) insertPayload.purchase_date = purchase_date;
    if (purchase_price != null && purchase_price !== '') {
      const parsed = parseFloat(purchase_price);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "Invalid purchase_price" },
          { status: 400 }
        );
      }
      insertPayload.purchase_price = parsed;
    }

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
