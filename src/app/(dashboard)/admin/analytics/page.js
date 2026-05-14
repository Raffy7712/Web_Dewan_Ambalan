import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getPageViewAnalytics } from "@/lib/admin-queries";
import { BarChart3 } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const stats = await getPageViewAnalytics();
  const hasSecret = Boolean(process.env.INTERNAL_ANALYTICS_SECRET);
  const totalsZero =
    stats.ok &&
    stats.totals &&
    stats.totals.last24h === 0 &&
    stats.totals.last7d === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="text-emerald-600" size={24} />
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Traffic halaman
        </h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Rekaman kunjungan per URL (GET) tujuh hari terakhir. Data muncul setelah
        variabel{" "}
        <code className="text-xs bg-[var(--surface-muted)] px-1 rounded">
          INTERNAL_ANALYTICS_SECRET
        </code>{" "}
        diset dan migrasi <span className="font-mono text-xs">v7</span>{" "}
        dijalankan.
      </p>

      <p className="text-sm text-[var(--text-secondary)] mb-6 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-muted)]/30 px-3 py-2">
        Panduan cara kerja, env, migrasi, dan rate limit traffic ada di berkas{" "}
        <span className="font-mono text-xs">Kitab_Suci_Agent.txt</span> bagian{" "}
        <strong>butir 12</strong> (Traffic / INTERNAL_ANALYTICS_SECRET).
      </p>

      {!hasSecret && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Logging traffic belum aktif: tambahkan{" "}
          <code className="font-mono text-xs">INTERNAL_ANALYTICS_SECRET</code>{" "}
          (string acak) di environment server, lalu restart aplikasi.
        </div>
      )}

      {hasSecret && stats.ok && totalsZero && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800/50 dark:bg-sky-900/20 px-4 py-3 text-sm text-sky-900 dark:text-sky-100">
          Angka masih nol: buka beberapa halaman publik situs (bukan hanya admin)
          di tab biasa, lalu kembali ke halaman ini dan muat ulang. Page view
          dicatat untuk navigasi GET melalui proxy.
        </div>
      )}

      {!stats.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {stats.error ?? "Gagal memuat statistik."}
        </div>
      )}

      {stats.ok && stats.totals && (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                24 jam terakhir
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                {stats.totals.last24h.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Catatan page view
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                7 hari terakhir
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                {stats.totals.last7d.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Sampel maks. 20.000 baris per query
              </p>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">
            Tren harian (7 hari)
          </h2>
          <div className="flex items-end gap-2 h-36 mb-8 px-1">
            {stats.byDay?.map(({ date, count }) => {
              const max = Math.max(
                1,
                ...stats.byDay.map((d) => d.count),
              );
              const barPx = Math.max(4, Math.round((count / max) * 120));
              return (
                <div
                  key={date}
                  className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full"
                >
                  <div
                    className="w-full max-w-[44px] mx-auto rounded-t-md bg-emerald-500 dark:bg-emerald-600"
                    style={{ height: barPx }}
                    title={`${date}: ${count}`}
                  />
                  <span className="text-[9px] text-[var(--text-muted)] truncate w-full text-center">
                    {date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">
            Jalur paling sering
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-primary)] text-[var(--text-muted)]">
                  <th className="text-left px-4 py-3 font-semibold">Path</th>
                  <th className="text-right px-4 py-3 font-semibold w-28">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topPaths?.length ? (
                  stats.topPaths.map(({ path, count }) => (
                    <tr
                      key={path}
                      className="border-b border-[var(--border-primary)] last:border-0"
                    >
                      <td className="px-4 py-2 font-mono text-xs text-[var(--text-primary)] break-all">
                        {path}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-[var(--text-secondary)]">
                        {count.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-[var(--text-muted)]"
                    >
                      Belum ada data. Buka beberapa halaman situs lalu kembali ke
                      sini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
