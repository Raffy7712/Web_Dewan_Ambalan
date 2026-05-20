import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    let whereClause = "";
    const params = [];

    if (itemIds !== "all") {
      const ids = itemIds.split(",").map((id) => id.trim());
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
      whereClause = `WHERE ii.id IN (${placeholders})`;
      params.push(...ids);
    }

    const { rows } = await query(
      `SELECT
        ii.id,
        ii.code,
        ii.name,
        ii.category_id,
        json_build_object('name', ic.name) AS inventory_categories,
        ii.location,
        ii.quantity,
        ii.unit
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      ${whereClause}
      ORDER BY ii.code ASC`,
      params
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No items found" },
        { status: 404 }
      );
    }

    if (format === "json") {
      return NextResponse.json({
        ok: true,
        items: rows,
        count: rows.length,
      });
    }

    if (format === "csv") {
      // Generate CSV format
      const headers = ["Code", "Name", "Category", "Location", "Quantity", "Unit"];
      const csvRows = rows.map((item) => [
        item.code,
        item.name,
        item.inventory_categories?.name || "Uncategorized",
        item.location || "N/A",
        item.quantity || 1,
        item.unit || "unit",
      ]);

      const csv = [
        headers.join(","),
        ...csvRows.map((row) =>
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
        items: rows,
        count: rows.length,
        format: "pdf",
        message: "Use this data with frontend PDF library (jsPDF + html2canvas)",
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'json', 'csv', or 'pdf'" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
