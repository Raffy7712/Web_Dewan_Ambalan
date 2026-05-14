"use client";

import { useMemo, useState } from "react";
import {
  formatRupiah,
  computeMonthTotals,
  monthLabel,
} from "@/lib/finance-queries";
import { Wallet, Landmark } from "lucide-react";

const DEFAULT_UI = {
  emptyTitle: "Transparansi keuangan",
  emptyBody:
    "Laporan keuangan belum dipublikasikan. Admin dapat mengunggah data melalui panel /admin/finance.",
  heroTitle: "Transparansi keuangan",
  heroSubtitle:
    "Dewan Ambalan SMK Al Furqon — laporan yang dipublikasikan untuk seluruh bidang.",
  tabRingkasan: "Ringkasan",
  kasCaption: "Kas (saldo akhir periode terbaru)",
  periodPrefix: "Periode:",
  monthlyTitle: "Ikhtisar per bulan",
  colPeriod: "Periode",
  colIncome: "Pemasukan",
  colExpense: "Pengeluaran",
  colBalance: "Saldo akhir",
  saldoAwal: "Saldo awal",
  saldoAkhir: "Saldo akhir",
  transactionsTitle: "Rincian transaksi",
  colDate: "Tanggal",
  colType: "Jenis",
  colDesc: "Keterangan",
  colAmount: "Jumlah",
  noTransactions: "Tidak ada transaksi tercatat.",
};

export default function KeuanganPublicTabs({
  months,
  transactionsByMonth,
  latestKas,
  latestPeriodLabel,
  ui: uiProp,
}) {
  const ui = { ...DEFAULT_UI, ...uiProp };
  const [tab, setTab] = useState("ringkasan");

  const summaries = useMemo(() => {
    return months.map((m) => {
      const tx = transactionsByMonth[m.id] ?? [];
      const t = computeMonthTotals(m.saldo_awal, tx);
      return { ...m, ...t };
    });
  }, [months, transactionsByMonth]);

  if (months.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Landmark className="mx-auto mb-4 text-[var(--text-muted)]" size={40} />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          {ui.emptyTitle}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm whitespace-pre-line">
          {ui.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
          <Wallet size={22} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            {ui.heroTitle}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{ui.heroSubtitle}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mt-6 border-b border-[var(--border-primary)]">
        <button
          type="button"
          onClick={() => setTab("ringkasan")}
          className={`shrink-0 px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
            tab === "ringkasan"
              ? "bg-emerald-600 text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          {ui.tabRingkasan}
        </button>
        {months.map((m) => {
          const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === key
                  ? "bg-emerald-600 text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              {monthLabel(m.year, m.month)}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5 md:p-6">
        {tab === "ringkasan" && (
          <div className="space-y-6">
            <div className="rounded-xl bg-[var(--surface-muted)] p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {ui.kasCaption}
              </p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {formatRupiah(latestKas ?? 0)}
              </p>
              {latestPeriodLabel && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {ui.periodPrefix} {latestPeriodLabel}
                </p>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)] mb-3">
                {ui.monthlyTitle}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] bg-[var(--surface-muted)] text-left text-xs text-[var(--text-muted)]">
                      <th className="px-3 py-2">{ui.colPeriod}</th>
                      <th className="px-3 py-2 text-right">{ui.colIncome}</th>
                      <th className="px-3 py-2 text-right">{ui.colExpense}</th>
                      <th className="px-3 py-2 text-right">{ui.colBalance}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--border-primary)] last:border-0"
                      >
                        <td className="px-3 py-2 font-medium">
                          {monthLabel(row.year, row.month)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600">
                          {formatRupiah(row.pemasukan)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-amber-700 dark:text-amber-400">
                          {formatRupiah(row.pengeluaran)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatRupiah(row.saldoAkhir)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab !== "ringkasan" &&
          months.map((m) => {
            const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
            if (tab !== key) return null;
            const tx = transactionsByMonth[m.id] ?? [];
            const t = computeMonthTotals(m.saldo_awal, tx);
            return (
              <div key={m.id} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[var(--text-muted)] text-xs">{ui.saldoAwal}</p>
                    <p className="font-mono font-semibold">
                      {formatRupiah(m.saldo_awal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] text-xs">{ui.saldoAkhir}</p>
                    <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(t.saldoAkhir)}
                    </p>
                  </div>
                </div>
                {m.catatan_publik && (
                  <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-pre-line">
                    {m.catatan_publik}
                  </div>
                )}
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {ui.transactionsTitle}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)] bg-[var(--surface-muted)] text-left text-xs text-[var(--text-muted)]">
                        <th className="px-3 py-2">{ui.colDate}</th>
                        <th className="px-3 py-2">{ui.colType}</th>
                        <th className="px-3 py-2">{ui.colDesc}</th>
                        <th className="px-3 py-2 text-right">{ui.colAmount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tx.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-6 text-center text-[var(--text-muted)]"
                          >
                            {ui.noTransactions}
                          </td>
                        </tr>
                      ) : (
                        tx.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-[var(--border-primary)] last:border-0"
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.tanggal}
                            </td>
                            <td className="px-3 py-2 capitalize text-xs font-medium">
                              <span
                                className={
                                  row.jenis === "pemasukan"
                                    ? "text-emerald-600"
                                    : "text-amber-700 dark:text-amber-400"
                                }
                              >
                                {row.jenis}
                              </span>
                            </td>
                            <td className="px-3 py-2">{row.keterangan}</td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatRupiah(row.jumlah)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
