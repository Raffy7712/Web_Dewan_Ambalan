import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/inventory/export/codes - export inventory item codes as JSON
// This will be used by frontend to generate PDF with QR/barcode
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemIds = searchParams.get("item_ids"); // comma-separated IDs or "all"
    const format = searchParams.get("format") || "json"; // json, csv, pdf

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
        unit
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
      // Generate CSV format
      const headers = ["Code", "Name", "Category", "Location", "Quantity", "Unit"];
      const rows = data.map((item) => [
        item.code,
        item.name,
        item.inventory_categories?.name || "Uncategorized",
        item.location || "N/A",
        item.quantity || 1,
        item.unit || "unit",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition":
            'attachment; filename="inventory-codes.csv"',
        },
      });
    }

    // PDF format - return data for frontend PDF generation
    if (format === "pdf") {
      return NextResponse.json({
        ok: true,
        items: data,
        count: data.length,
        format: "pdf",
        message: "Use this data with frontend PDF library (jsPDF + html2canvas)",
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'json', 'csv', or 'pdf'" },
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
