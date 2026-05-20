import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/inventory/items - list all items with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`ii.category_id = $${paramIdx++}`);
      params.push(category);
    }

    if (condition) {
      conditions.push(`ii.condition = $${paramIdx++}`);
      params.push(condition);
    }

    if (search) {
      conditions.push(`(ii.code ILIKE $${paramIdx} OR ii.name ILIKE $${paramIdx} OR ii.location ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM inventory_items ii ${whereClause}`,
      params
    );
    const count = parseInt(countResult.rows[0]?.total || "0");

    // Data query with join
    const dataResult = await query(
      `SELECT
        ii.id,
        ii.code,
        ii.name,
        ii.category_id,
        json_build_object('name', ic.name) AS inventory_categories,
        ii.description,
        ii.quantity,
        ii.unit,
        ii.condition,
        ii.location,
        ii.purchase_date,
        ii.purchase_price,
        ii.last_checked,
        ii.created_at,
        ii.updated_at
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      ${whereClause}
      ORDER BY ii.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      ok: true,
      items: dataResult.rows || [],
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("Error:", err);
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

    const { rows } = await query(
      `INSERT INTO inventory_items (code, name, category_id, description, quantity, unit, location, purchase_date, purchase_price, condition)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [code, name, category_id ?? null, description ?? null, quantity, unit ?? null, location ?? null, purchase_date ?? null, purchase_price ?? null, "baik"]
    );

    return NextResponse.json({
      ok: true,
      item: rows[0],
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
