import { getFinanceDataPublic } from "@/lib/finance-queries";
import { getCmsText } from "@/lib/cms";
import KeuanganPublicTabs from "./KeuanganPublicTabs";

export const metadata = {
  title: "Transparansi Keuangan — Dewan Ambalan",
  description:
    "Laporan kas, pemasukan, dan pengeluaran Dewan Ambalan yang dipublikasikan untuk transparansi.",
};

export default async function KeuanganPage() {
  const data = await getFinanceDataPublic();
  const ui = await loadKeuanganCmsStrings();
  return <KeuanganPublicTabs {...data} ui={ui} />;
}

async function loadKeuanganCmsStrings() {
  const [
    emptyTitle,
    emptyBody,
    heroTitle,
    heroSubtitle,
    tabRingkasan,
    kasCaption,
    periodPrefix,
    monthlyTitle,
    colPeriod,
    colIncome,
    colExpense,
    colBalance,
    saldoAwal,
    saldoAkhir,
    transactionsTitle,
    colDate,
    colType,
    colDesc,
    colAmount,
    noTransactions,
  ] = await Promise.all([
    getCmsText("keuangan", "empty", "title", "Transparansi keuangan"),
    getCmsText(
      "keuangan",
      "empty",
      "body",
      "Laporan keuangan belum dipublikasikan. Admin dapat mengunggah data melalui panel /admin/finance.",
    ),
    getCmsText("keuangan", "hero", "title", "Transparansi keuangan"),
    getCmsText(
      "keuangan",
      "hero",
      "subtitle",
      "Dewan Ambalan SMK Al Furqon — laporan yang dipublikasikan untuk seluruh bidang.",
    ),
    getCmsText("keuangan", "tabs", "ringkasan", "Ringkasan"),
    getCmsText(
      "keuangan",
      "ringkasan",
      "kas_caption",
      "Kas (saldo akhir periode terbaru)",
    ),
    getCmsText("keuangan", "ringkasan", "period_prefix", "Periode:"),
    getCmsText(
      "keuangan",
      "ringkasan",
      "monthly_title",
      "Ikhtisar per bulan",
    ),
    getCmsText("keuangan", "table_summary", "col_period", "Periode"),
    getCmsText("keuangan", "table_summary", "col_income", "Pemasukan"),
    getCmsText("keuangan", "table_summary", "col_expense", "Pengeluaran"),
    getCmsText("keuangan", "table_summary", "col_balance", "Saldo akhir"),
    getCmsText("keuangan", "detail", "saldo_awal", "Saldo awal"),
    getCmsText("keuangan", "detail", "saldo_akhir", "Saldo akhir"),
    getCmsText(
      "keuangan",
      "detail",
      "transactions_title",
      "Rincian transaksi",
    ),
    getCmsText("keuangan", "table_tx", "col_date", "Tanggal"),
    getCmsText("keuangan", "table_tx", "col_type", "Jenis"),
    getCmsText("keuangan", "table_tx", "col_desc", "Keterangan"),
    getCmsText("keuangan", "table_tx", "col_amount", "Jumlah"),
    getCmsText(
      "keuangan",
      "detail",
      "no_transactions",
      "Tidak ada transaksi tercatat.",
    ),
  ]);

  return {
    emptyTitle,
    emptyBody,
    heroTitle,
    heroSubtitle,
    tabRingkasan,
    kasCaption,
    periodPrefix,
    monthlyTitle,
    colPeriod,
    colIncome,
    colExpense,
    colBalance,
    saldoAwal,
    saldoAkhir,
    transactionsTitle,
    colDate,
    colType,
    colDesc,
    colAmount,
    noTransactions,
  };
}
