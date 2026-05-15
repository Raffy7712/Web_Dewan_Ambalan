import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/inventory/items/[id] - get single item
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = createAdminClient();

    const { data, error } = await db
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
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
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

// PUT /api/inventory/items/[id] - update item
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Only allow updating valid fields
    const allowedFields = [
      "name", "category_id", "description", "quantity",
      "unit", "condition", "location", "purchase_date",
      "purchase_price", "last_checked",
    ];
    const updatePayload = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Skip empty strings for UUID/numeric fields
        if (field === "category_id" && body[field] === "") continue;
        updatePayload[field] = body[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data, error } = await db
      .from("inventory_items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update item" },
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

// DELETE /api/inventory/items/[id] - delete item
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const db = createAdminClient();

    const { error } = await db
      .from("inventory_items")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
