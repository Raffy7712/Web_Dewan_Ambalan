import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/inventory/items/[id] - get single item (admin only)
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
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

// PUT /api/inventory/items/[id] - update item (admin only)
export async function PUT(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
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
        // Skip empty strings for UUID, numeric, and date fields
        if (field === "category_id" && body[field] === "") continue;
        if (field === "purchase_price" && body[field] === "") continue;
        if (field === "purchase_date" && body[field] === "") continue;
        // Convert numeric fields
        if (field === "quantity") {
          updatePayload[field] = parseInt(body[field]) || 1;
          continue;
        }
        if (field === "purchase_price" && body[field] != null) {
          updatePayload[field] = parseFloat(body[field]);
          continue;
        }
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
      console.error("Error updating item:", error);
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

// DELETE /api/inventory/items/[id] - delete item (admin only)
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
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
