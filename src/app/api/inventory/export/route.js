import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

// GET /api/inventory/export - export inventory data (admin only)
export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const itemIds = searchParams.get("item_ids"); // comma-separated IDs or "all"
    const format = searchParams.get("format") || "json"; // json, csv, xlsx

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
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const ids = itemIds.split(",").map((id) => id.trim()).filter((id) => UUID_RE.test(id));
      if (ids.length === 0) {
        return NextResponse.json(
          { error: "No valid item IDs provided" },
          { status: 400 }
        );
      }
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

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const xlsxRows = data.map((item) => ({
        Kode: item.code,
        Nama: item.name,
        Kategori: item.inventory_categories?.name || "Tidak berkategori",
        Lokasi: item.location || "-",
        Jumlah: item.quantity || 1,
        Satuan: item.unit || "unit",
        Kondisi: item.condition || "baik",
        "Tanggal Pembelian": item.purchase_date || "-",
        "Harga Pembelian": item.purchase_price ? Number(item.purchase_price) : 0,
      }));

      const ws = XLSX.utils.json_to_sheet(
        xlsxRows.length > 0 ? xlsxRows : [{ Keterangan: "Belum ada data inventaris" }],
      );
      ws["!cols"] = [
        { wch: 14 }, // Kode
        { wch: 30 }, // Nama
        { wch: 20 }, // Kategori
        { wch: 18 }, // Lokasi
        { wch: 8 },  // Jumlah
        { wch: 8 },  // Satuan
        { wch: 15 }, // Kondisi
        { wch: 16 }, // Tanggal
        { wch: 15 }, // Harga
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Inventaris");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const d = new Date();
      const filename = `inventaris_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}.xlsx`;

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'json', 'csv', or 'xlsx'" },
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
