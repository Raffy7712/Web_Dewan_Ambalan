import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/db";

// GET /api/inventory/checks?item_id=xxx - get check logs for item
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
      `SELECT COUNT(*) AS total FROM item_checks WHERE item_id = $1`,
      [itemId]
    );
    const count = parseInt(countResult.rows[0]?.total || "0");

    // Data query
    const { rows } = await query(
      `SELECT * FROM item_checks
       WHERE item_id = $1
       ORDER BY check_date DESC
       LIMIT $2 OFFSET $3`,
      [itemId, limit, offset]
    );

    return NextResponse.json({
      ok: true,
      checks: rows || [],
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

// POST /api/inventory/checks - create check log
export async function POST(request) {
  const client = await getClient();
  try {
    const body = await request.json();
    const { item_id, condition, notes, requires_maintenance = false } = body;

    if (!item_id || !condition) {
      client.release();
      return NextResponse.json(
        { error: "item_id and condition are required" },
        { status: 400 }
      );
    }

    if (!["baik", "perlu_perbaikan", "rusak"].includes(condition)) {
      client.release();
      return NextResponse.json(
        { error: "Invalid condition value" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Verify item exists
    const itemResult = await client.query(
      `SELECT id FROM inventory_items WHERE id = $1`,
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Create check log
    const insertResult = await client.query(
      `INSERT INTO item_checks (item_id, condition, notes, requires_maintenance)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [item_id, condition, notes ?? null, requires_maintenance]
    );

    // Update item's condition and last_checked
    await client.query(
      `UPDATE inventory_items SET condition = $1, last_checked = NOW() WHERE id = $2`,
      [condition, item_id]
    );

    await client.query("COMMIT");
    client.release();

    return NextResponse.json({
      ok: true,
      check: insertResult.rows[0],
    });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    client.release();
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
