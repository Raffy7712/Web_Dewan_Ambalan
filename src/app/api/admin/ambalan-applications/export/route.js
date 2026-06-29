import { query } from "@/lib/db";
import { getSession } from "@/app/actions/auth";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query(
    `SELECT
       full_name AS "Nama Lengkap",
       class_name AS "Kelas",
       phone AS "No. WhatsApp",
       motivation AS "Motivasi",
       experience AS "Pengalaman",
       period AS "Periode",
       status AS "Status",
       submitter_ip AS "IP Pendaftar",
       created_at AS "Tanggal Daftar"
     FROM ambalan_applications
     ORDER BY created_at DESC`,
    []
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Pendaftar");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pendaftar-ambalan-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
