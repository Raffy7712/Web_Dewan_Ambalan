import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    // Count query
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM maintenance_logs WHERE item_id = $1`,
      [itemId]
    );
    const count = parseInt(countResult.rows[0]?.total || "0");

    // Data query
    const { rows } = await query(
      `SELECT * FROM maintenance_logs
       WHERE item_id = $1
       ORDER BY maintenance_date DESC
       LIMIT $2 OFFSET $3`,
      [itemId, limit, offset]
    );

    return NextResponse.json({
      ok: true,
      logs: rows || [],
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

    // Verify item exists
    const itemResult = await query(
      `SELECT id FROM inventory_items WHERE id = $1`,
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const { rows } = await query(
      `INSERT INTO maintenance_logs (item_id, maintenance_type, description, cost, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [item_id, maintenance_type, description ?? null, cost ?? null, notes ?? null]
    );

    return NextResponse.json({
      ok: true,
      log: rows[0],
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
