import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/inventory/items/[id] - get single item
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { rows } = await query(
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
      WHERE ii.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

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

const ALLOWED_ITEM_FIELDS = new Set([
  "name", "category_id", "description", "quantity", "unit",
  "condition", "location", "purchase_date", "purchase_price",
  "last_checked", "code"
]);

// PUT /api/inventory/items/[id] - update item
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Whitelist column names to prevent SQL injection
    const keys = Object.keys(body).filter(k => ALLOWED_ITEM_FIELDS.has(k));
    if (keys.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    for (const key of keys) {
      setClauses.push(`${key} = $${paramIdx++}`);
      values.push(body[key]);
    }

    values.push(id);

    const { rows } = await query(
      `UPDATE inventory_items SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 }
      );
    }

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

// DELETE /api/inventory/items/[id] - delete item
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { rowCount } = await query(
      `DELETE FROM inventory_items WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Item deleted successfully",
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
