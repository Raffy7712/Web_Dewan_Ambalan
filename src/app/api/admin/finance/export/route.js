import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase";
import { computeMonthTotals, monthLabel } from "@/lib/finance-queries";

function filenameStem() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `laporan-keuangan_${y}-${m}-${day}`;
}

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  // Fetch all finance months
  const { data: months, error: monthsError } = await db
    .from("finance_months")
    .select("id, year, month, saldo_awal, catatan_publik, is_published, updated_at")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (monthsError) {
    console.error("finance export months:", monthsError.message);
    return NextResponse.json(
      { error: "Gagal mengambil data keuangan" },
      { status: 500 },
    );
  }

  const list = months ?? [];
  if (list.length === 0) {
    return NextResponse.json(
      { error: "Belum ada data keuangan" },
      { status: 404 },
    );
  }

  // Fetch all transactions for all months
  const ids = list.map((m) => m.id);
  const { data: txs, error: txsError } = await db
    .from("finance_transactions")
    .select("id, month_id, tanggal, jenis, keterangan, jumlah")
    .in("month_id", ids)
    .order("tanggal", { ascending: true });

  if (txsError) {
    console.error("finance export txs:", txsError.message);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 },
    );
  }

  // Group transactions by month_id
  const txByMonth = Object.fromEntries(ids.map((id) => [id, []]));
  for (const t of txs ?? []) {
    if (!txByMonth[t.month_id]) txByMonth[t.month_id] = [];
    txByMonth[t.month_id].push(t);
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan per periode
  const summaryRows = list.map((m) => {
    const mTx = txByMonth[m.id] ?? [];
    const totals = computeMonthTotals(m.saldo_awal, mTx);
    return {
      Periode: monthLabel(m.year, m.month),
      "Saldo Awal": Number(m.saldo_awal),
      Pemasukan: totals.pemasukan,
      Pengeluaran: totals.pengeluaran,
      "Saldo Akhir": totals.saldoAkhir,
      Dipublikasikan: m.is_published ? "Ya" : "Tidak",
      "Catatan Publik": m.catatan_publik ?? "",
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(
    summaryRows.length > 0
      ? summaryRows
      : [{ Keterangan: "Belum ada data periode keuangan" }],
  );

  // Set column widths for summary
  wsSummary["!cols"] = [
    { wch: 18 }, // Periode
    { wch: 15 }, // Saldo Awal
    { wch: 15 }, // Pemasukan
    { wch: 15 }, // Pengeluaran
    { wch: 15 }, // Saldo Akhir
    { wch: 13 }, // Dipublikasikan
    { wch: 30 }, // Catatan Publik
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // Sheet 2: Detail transaksi
  const txRows = [];
  for (const m of list) {
    const mTx = txByMonth[m.id] ?? [];
    for (const t of mTx) {
      txRows.push({
        Periode: monthLabel(m.year, m.month),
        Tanggal: t.tanggal ?? "",
        Jenis: t.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran",
        Keterangan: t.keterangan ?? "",
        Jumlah: Number(t.jumlah),
      });
    }
  }

  const wsTx = XLSX.utils.json_to_sheet(
    txRows.length > 0
      ? txRows
      : [{ Keterangan: "Belum ada transaksi tercatat" }],
  );

  wsTx["!cols"] = [
    { wch: 18 }, // Periode
    { wch: 12 }, // Tanggal
    { wch: 14 }, // Jenis
    { wch: 35 }, // Keterangan
    { wch: 15 }, // Jumlah
  ];

  XLSX.utils.book_append_sheet(wb, wsTx, "Detail Transaksi");

  try {
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const name = `${filenameStem()}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("finance xlsx export:", e);
    return NextResponse.json(
      { error: "Gagal membuat berkas" },
      { status: 500 },
    );
  }
}
