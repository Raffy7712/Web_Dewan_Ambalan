import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/inventory/categories - list all categories
export async function GET() {
  try {
    const db = createAdminClient();

    const { data, error } = await db
      .from("inventory_categories")
      .select("id, name, description")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      categories: data || [],
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/categories - create category
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data, error } = await db
      .from("inventory_categories")
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      category: data,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
