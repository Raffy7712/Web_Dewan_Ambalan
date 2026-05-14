"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFinanceMonthAction,
  updateFinanceMonthAction,
  deleteFinanceMonthAction,
  addFinanceTransactionAction,
  deleteFinanceTransactionAction,
} from "@/app/actions/finance";
import {
  formatRupiah,
  computeMonthTotals,
  monthLabel,
} from "@/lib/finance-queries";
import {
  Wallet,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2024, i, 1).toLocaleDateString("id-ID", { month: "long" }),
}));

export default function FinanceAdminManager({ months, transactionsByMonth }) {
  const router = useRouter();
  const [pickedId, setPickedId] = useState(null);
  const selectedId = useMemo(() => {
    if (!months.length) return null;
    if (pickedId && months.some((m) => m.id === pickedId)) return pickedId;
    return months[0].id;
  }, [months, pickedId]);
  const [createState, createAction, createPending] = useActionState(
    createFinanceMonthAction,
    null,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateFinanceMonthAction,
    null,
  );
  const [txState, txAction, txPending] = useActionState(
    addFinanceTransactionAction,
    null,
  );

  const snapRef = useRef("");
  useEffect(() => {
    const s = JSON.stringify({
      c: !!createState?.success,
      u: !!updateState?.success,
      t: !!txState?.success,
    });
    if (s === snapRef.current) return;
    snapRef.current = s;
    if (createState?.success || updateState?.success || txState?.success) {
      router.refresh();
    }
  }, [createState, updateState, txState, router]);

  const selected = months.find((m) => m.id === selectedId);
  const txs = useMemo(() => {
    if (!selected) return [];
    return transactionsByMonth[selected.id] ?? [];
  }, [selected, transactionsByMonth]);
  const totals = useMemo(
    () =>
      selected
        ? computeMonthTotals(selected.saldo_awal, txs)
        : { pemasukan: 0, pengeluaran: 0, saldoAkhir: 0 },
    [selected, txs],
  );

  const yNow = new Date().getFullYear();

  async function onDeleteMonth(id) {
    if (
      !confirm(
        "Hapus periode ini beserta semua transaksinya? Tindakan tidak bisa dibatalkan.",
      )
    )
      return;
    const fd = new FormData();
    fd.set("month_id", id);
    const r = await deleteFinanceMonthAction(null, fd);
    if (r?.error) alert(r.error);
    else {
      if (pickedId === id) setPickedId(null);
      router.refresh();
    }
  }

  async function onDeleteTx(id) {
    if (!confirm("Hapus transaksi ini?")) return;
    const fd = new FormData();
    fd.set("transaction_id", id);
    const r = await deleteFinanceTransactionAction(null, fd);
    if (r?.error) alert(r.error);
    else router.refresh();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
          <Wallet size={22} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Laporan keuangan ambalan
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Perbarui setiap bulan: saldo awal, transaksi pemasukan/pengeluaran,
            lalu publikasikan agar tampil di halaman transparansi{" "}
            <a
              href="/keuangan"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              /keuangan
            </a>
            .
          </p>
        </div>
      </div>

      {(createState?.error ||
        updateState?.error ||
        txState?.error) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>
            {createState?.error || updateState?.error || txState?.error}
          </span>
        </div>
      )}

      {/* Tambah periode */}
      <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Plus size={18} className="text-emerald-600" />
          Periode bulan baru
        </h2>
        <form action={createAction} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <label className="block text-sm">
            <span className="text-[var(--text-muted)] text-xs font-medium">
              Tahun
            </span>
            <input
              name="year"
              type="number"
              required
              min={2020}
              max={2100}
              defaultValue={yNow}
              className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)] text-xs font-medium">
              Bulan
            </span>
            <select
              name="month"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2 lg:col-span-1">
            <span className="text-[var(--text-muted)] text-xs font-medium">
              Saldo awal (Rp)
            </span>
            <input
              name="saldo_awal"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm pb-2 sm:col-span-2 lg:col-span-1">
            <input type="checkbox" name="is_published" value="on" className="rounded" />
            Publikasikan ke publik
          </label>
          <label className="block text-sm sm:col-span-2 lg:col-span-4">
            <span className="text-[var(--text-muted)] text-xs font-medium">
              Catatan publik (opsional)
            </span>
            <textarea
              name="catatan_publik"
              rows={2}
              className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
              placeholder="Mis. rincian singkat atau pengingat untuk anggota"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={createPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {createPending ? "Menyimpan…" : "Simpan periode"}
            </button>
          </div>
        </form>
      </section>

      {months.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          Belum ada periode. Tambahkan bulan pertama di atas. Jika error
          persisten, jalankan{" "}
          <code className="text-xs bg-[var(--surface-muted)] px-1 rounded">
            migration-v8.sql
          </code>{" "}
          di Supabase.
        </p>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Daftar periode
            </h2>
            <ul className="space-y-2">
              {months.map((m) => {
                const mTx = transactionsByMonth[m.id] ?? [];
                const t = computeMonthTotals(m.saldo_awal, mTx);
                const active = m.id === selectedId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setPickedId(m.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                        active
                          ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30"
                          : "border-[var(--border-primary)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {monthLabel(m.year, m.month)}
                        </span>
                        {m.is_published ? (
                          <Eye size={14} className="text-emerald-600 shrink-0" />
                        ) : (
                          <EyeOff size={14} className="text-[var(--text-muted)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Saldo akhir:{" "}
                        <span className="font-mono font-semibold">
                          {formatRupiah(t.saldoAkhir)}
                        </span>
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected && (
            <div className="lg:col-span-3 space-y-6">
              <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {monthLabel(selected.year, selected.month)}
                  </h2>
                  <button
                    type="button"
                    onClick={() => onDeleteMonth(selected.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    Hapus periode
                  </button>
                </div>

                <form action={updateAction} className="space-y-4">
                  <input type="hidden" name="month_id" value={selected.id} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <span className="text-xs text-[var(--text-muted)]">
                        Saldo awal (Rp)
                      </span>
                      <input
                        name="saldo_awal"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        key={selected.id + String(selected.saldo_awal)}
                        defaultValue={String(selected.saldo_awal)}
                        className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm pt-6">
                      <input
                        type="checkbox"
                        name="is_published"
                        value="on"
                        defaultChecked={selected.is_published}
                        className="rounded"
                      />
                      Tampilkan di halaman publik
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="text-xs text-[var(--text-muted)]">
                      Catatan untuk publik
                    </span>
                    <textarea
                      name="catatan_publik"
                      rows={3}
                      defaultValue={selected.catatan_publik ?? ""}
                      className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {updatePending ? "Menyimpan…" : "Simpan perubahan periode"}
                  </button>
                </form>

                <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-[var(--surface-muted)] p-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">
                      Pemasukan
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(totals.pemasukan)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">
                      Pengeluaran
                    </p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {formatRupiah(totals.pengeluaran)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-muted)]">
                      Saldo akhir
                    </p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {formatRupiah(totals.saldoAkhir)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                  Transaksi
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-primary)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)] bg-[var(--surface-muted)] text-left text-xs text-[var(--text-muted)]">
                        <th className="px-3 py-2">Tanggal</th>
                        <th className="px-3 py-2">Jenis</th>
                        <th className="px-3 py-2">Keterangan</th>
                        <th className="px-3 py-2 text-right">Jumlah</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {txs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-6 text-center text-[var(--text-muted)]"
                          >
                            Belum ada transaksi.
                          </td>
                        </tr>
                      ) : (
                        txs.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-[var(--border-primary)] last:border-0"
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.tanggal}
                            </td>
                            <td className="px-3 py-2 capitalize">
                              <span
                                className={
                                  row.jenis === "pemasukan"
                                    ? "text-emerald-600 font-medium"
                                    : "text-amber-700 font-medium"
                                }
                              >
                                {row.jenis}
                              </span>
                            </td>
                            <td className="px-3 py-2">{row.keterangan}</td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatRupiah(row.jumlah)}
                            </td>
                            <td className="px-1 py-2">
                              <button
                                type="button"
                                onClick={() => onDeleteTx(row.id)}
                                className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-600"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <form action={txAction} className="mt-4 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                  <input type="hidden" name="month_id" value={selected.id} />
                  <label className="block text-sm lg:col-span-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      Tanggal
                    </span>
                    <input
                      name="tanggal"
                      type="date"
                      required
                      className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm lg:col-span-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      Jenis
                    </span>
                    <select
                      name="jenis"
                      required
                      className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-2 py-2 text-sm"
                    >
                      <option value="pemasukan">Pemasukan</option>
                      <option value="pengeluaran">Pengeluaran</option>
                    </select>
                  </label>
                  <label className="block text-sm lg:col-span-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      Keterangan
                    </span>
                    <input
                      name="keterangan"
                      required
                      maxLength={300}
                      className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-3 py-2 text-sm"
                      placeholder="Iuran, pembelian, dll."
                    />
                  </label>
                  <label className="block text-sm lg:col-span-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      Jumlah (Rp)
                    </span>
                    <input
                      name="jumlah"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-2 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={txPending}
                    className="lg:col-span-1 rounded-lg bg-slate-800 dark:bg-slate-200 dark:text-slate-900 text-white px-3 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {txPending ? "…" : "Tambah"}
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
