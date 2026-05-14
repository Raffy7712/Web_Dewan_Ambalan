import { createAdminClient } from "./supabase";

export function formatRupiah(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function computeMonthTotals(saldoAwal, transactions) {
  let pemasukan = 0;
  let pengeluaran = 0;
  for (const t of transactions ?? []) {
    const j = Number(t.jumlah);
    if (t.jenis === "pemasukan") pemasukan += j;
    else pengeluaran += j;
  }
  const saldoAkhir = Number(saldoAwal) + pemasukan - pengeluaran;
  return { pemasukan, pengeluaran, saldoAkhir };
}

export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

/** @returns {{ months: object[], transactionsByMonth: Record<string, object[]> }} */
export async function getFinanceDataAdmin() {
  const db = createAdminClient();
  const { data: months, error } = await db
    .from("finance_months")
    .select(
      "id, year, month, saldo_awal, catatan_publik, is_published, updated_at",
    )
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) {
    if (error.code !== "42P01") console.error("getFinanceDataAdmin:", error.message);
    return { months: [], transactionsByMonth: {} };
  }

  const list = months ?? [];
  if (list.length === 0) return { months: [], transactionsByMonth: {} };

  const ids = list.map((m) => m.id);
  const { data: txs } = await db
    .from("finance_transactions")
    .select("id, month_id, tanggal, jenis, keterangan, jumlah")
    .in("month_id", ids)
    .order("tanggal", { ascending: true });

  const transactionsByMonth = Object.fromEntries(ids.map((id) => [id, []]));
  for (const t of txs ?? []) {
    if (!transactionsByMonth[t.month_id]) transactionsByMonth[t.month_id] = [];
    transactionsByMonth[t.month_id].push(t);
  }

  return { months: list, transactionsByMonth };
}

/** Hanya periode yang dipublikasikan — untuk halaman publik. */
export async function getFinanceDataPublic() {
  const db = createAdminClient();
  const { data: months, error } = await db
    .from("finance_months")
    .select("id, year, month, saldo_awal, catatan_publik, is_published, updated_at")
    .eq("is_published", true)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) {
    if (error.code !== "42P01") console.error("getFinanceDataPublic:", error.message);
    return { months: [], transactionsByMonth: {}, latestKas: null };
  }

  const list = months ?? [];
  if (list.length === 0) {
    return { months: [], transactionsByMonth: {}, latestKas: null };
  }

  const ids = list.map((m) => m.id);
  const { data: txs } = await db
    .from("finance_transactions")
    .select("id, month_id, tanggal, jenis, keterangan, jumlah")
    .in("month_id", ids)
    .order("tanggal", { ascending: true });

  const transactionsByMonth = Object.fromEntries(ids.map((id) => [id, []]));
  for (const t of txs ?? []) {
    if (!transactionsByMonth[t.month_id]) transactionsByMonth[t.month_id] = [];
    transactionsByMonth[t.month_id].push(t);
  }

  const [latest] = list;
  const txLatest = transactionsByMonth[latest.id] ?? [];
  const { saldoAkhir } = computeMonthTotals(latest.saldo_awal, txLatest);

  return {
    months: list,
    transactionsByMonth,
    latestKas: saldoAkhir,
    latestPeriodLabel: monthLabel(latest.year, latest.month),
  };
}
