"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setAccountRoleAction } from "@/app/actions/admin-users";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";

const ROLES = [
  { value: "user", label: "Anggota" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
];

export default function StaffRoleManager({
  accounts,
  currentUserId,
  adminActiveCount,
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(setAccountRoleAction, null);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  function rowLocked(a) {
    if (!a.is_active) return true;
    if (a.role === "admin" && adminActiveCount <= 1 && a.id === currentUserId) {
      return true;
    }
    return false;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
        Manajemen admin
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-2 max-w-2xl">
        Ubah peran akun aktif (anggota, moderator, atau admin). Moderator mengikuti
        matriks izin di{" "}
        <Link
          href="/admin/permissions"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Role &amp; izin
        </Link>
        . Untuk memblokir atau membuka blokir akun, gunakan{" "}
        <Link
          href="/admin/users"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Akun &amp; blokir
        </Link>
        .
      </p>
      <p className="text-xs text-[var(--text-muted)] mb-6">
        Admin aktif saat ini:{" "}
        <span className="font-semibold text-[var(--text-primary)]">{adminActiveCount}</span>
        {adminActiveCount <= 1 ? (
          <span className="text-amber-600 dark:text-amber-400">
            {" "}
            — tambahkan admin cadangan sebelum menurunkan peran admin terakhir.
          </span>
        ) : null}
      </p>

      {state?.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-200">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          Peran berhasil diperbarui.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--border-primary)] text-[var(--text-muted)]">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">Email</th>
              <th className="px-4 py-3 font-semibold">Peran</th>
              <th className="px-4 py-3 font-semibold w-44">Ubah</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const locked = rowLocked(a);
              const isSelf = a.id === currentUserId;
              return (
                <tr
                  key={a.id}
                  className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--surface-muted)]/60"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    <span className="flex items-center gap-1.5">
                      {a.display_name}
                      {a.role === "admin" && (
                        <Shield
                          size={14}
                          className="text-emerald-600 shrink-0"
                          aria-label="admin"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">
                    {a.username}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs hidden lg:table-cell max-w-[200px] truncate">
                    {a.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">
                    {a.role}
                    {!a.is_active && (
                      <span className="ml-1 text-xs text-slate-500">(nonaktif)</span>
                    )}
                    {a.banned && (
                      <span className="ml-1 text-xs text-red-600">(terblokir)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {locked ? (
                      <span className="text-xs text-[var(--text-muted)]">
                        {!a.is_active
                          ? "—"
                          : isSelf
                            ? "Admin tunggal — tambah admin lain dulu"
                            : "—"}
                      </span>
                    ) : (
                      <form action={action} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="account_id" value={a.id} />
                        <select
                          name="role"
                          defaultValue={a.role}
                          className="rounded-lg border border-[var(--border-primary)] bg-[var(--surface-app)] px-2 py-1.5 text-xs font-medium text-[var(--text-primary)]"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          Simpan
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
