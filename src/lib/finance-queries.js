import { query } from "./db";
import { computeMonthTotals, monthLabel } from "./finance-utils";

/** @returns {{ months: object[], transactionsByMonth: Record<string, object[]> }} */
export async function getFinanceDataAdmin() {
  let list;
  try {
    const { rows } = await query(
      `SELECT id, year, month, saldo_awal, catatan_publik, is_published, updated_at
       FROM finance_months
       ORDER BY year DESC, month DESC`,
      []
    );
    list = rows ?? [];
  } catch (err) {
    if (!err.message?.includes("finance_months")) console.error("getFinanceDataAdmin:", err.message);
    return { months: [], transactionsByMonth: {} };
  }

  if (list.length === 0) return { months: [], transactionsByMonth: {} };

  const ids = list.map((m) => m.id);
  let txs;
  try {
    const result = await query(
      `SELECT id, month_id, tanggal, jenis, keterangan, jumlah
       FROM finance_transactions
       WHERE month_id = ANY($1)
       ORDER BY tanggal ASC`,
      [ids]
    );
    txs = result.rows ?? [];
  } catch (err) {
    console.error("getFinanceDataAdmin transactions:", err.message);
    txs = [];
  }

  const transactionsByMonth = Object.fromEntries(ids.map((id) => [id, []]));
  for (const t of txs ?? []) {
    if (!transactionsByMonth[t.month_id]) transactionsByMonth[t.month_id] = [];
    transactionsByMonth[t.month_id].push(t);
  }

  return { months: list, transactionsByMonth };
}

/** Hanya periode yang dipublikasikan — untuk halaman publik. */
export async function getFinanceDataPublic() {
  let list;
  try {
    const { rows } = await query(
      `SELECT id, year, month, saldo_awal, catatan_publik, is_published, updated_at
       FROM finance_months
       WHERE is_published = true
       ORDER BY year DESC, month DESC`,
      []
    );
    list = rows ?? [];
  } catch (err) {
    if (!err.message?.includes("finance_months")) console.error("getFinanceDataPublic:", err.message);
    return { months: [], transactionsByMonth: {}, latestKas: null };
  }

  if (list.length === 0) {
    return { months: [], transactionsByMonth: {}, latestKas: null };
  }

  const ids = list.map((m) => m.id);
  let txs;
  try {
    const result = await query(
      `SELECT id, month_id, tanggal, jenis, keterangan, jumlah
       FROM finance_transactions
       WHERE month_id = ANY($1)
       ORDER BY tanggal ASC`,
      [ids]
    );
    txs = result.rows ?? [];
  } catch (err) {
    console.error("getFinanceDataPublic transactions:", err.message);
    txs = [];
  }

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
