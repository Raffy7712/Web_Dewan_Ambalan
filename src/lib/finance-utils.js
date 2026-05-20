/**
 * finance-utils.js — Pure utility functions for finance formatting
 * Safe to import from client components (no server-only dependencies)
 */

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
