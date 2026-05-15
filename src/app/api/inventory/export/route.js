import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/inventory/export - export inventory data (admin only)
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const itemIds = searchParams.get("item_ids"); // comma-separated IDs or "all"
    const format = searchParams.get("format") || "json"; // json, csv

    if (!itemIds) {
      return NextResponse.json(
        { error: "item_ids parameter is required (use 'all' for all items)" },
        { status: 400 }
      );
    }

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
        location,
        quantity,
        unit,
        condition,
        purchase_date,
        purchase_price
      `
      );

    if (itemIds !== "all") {
      const ids = itemIds.split(",").map((id) => id.trim());
      query = query.in("id", ids);
    }

    const { data, error } = await query.order("code", { ascending: true });

    if (error) {
      console.error("Error fetching items for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No items found" },
        { status: 404 }
      );
    }

    if (format === "json") {
      return NextResponse.json({
        ok: true,
        items: data,
        count: data.length,
      });
    }

    if (format === "csv") {
      const headers = ["Code", "Name", "Category", "Location", "Quantity", "Unit", "Condition", "Purchase Date", "Purchase Price"];
      const rows = data.map((item) => [
        item.code,
        item.name,
        item.inventory_categories?.name || "Uncategorized",
        item.location || "N/A",
        item.quantity || 1,
        item.unit || "unit",
        item.condition || "baik",
        item.purchase_date || "",
        item.purchase_price || "",
      ]);

      const escapeCsv = (cell) => {
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition":
            'attachment; filename="inventory-export.csv"',
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'json' or 'csv'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
