"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setAccountBannedAction, setAccountRoleAction } from "@/app/actions/admin-users";
import { AlertCircle, Ban, CheckCircle, Shield } from "lucide-react";

export default function UsersManager({ accounts, currentUserId }) {
  const router = useRouter();
  const [openId, setOpenId] = useState(null);
  const [banState, banAction, banPending] = useActionState(
    setAccountBannedAction,
    null,
  );
  const [roleState, roleAction, rolePending] = useActionState(
    setAccountRoleAction,
    null,
  );
  const [roleOpenId, setRoleOpenId] = useState(null);

  useEffect(() => {
    if (banState?.success || roleState?.success) router.refresh();
  }, [banState?.success, roleState?.success, router]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">
        Akun pengguna
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Blokir akun yang melanggar. Pengguna terblokir tidak bisa login dan
        diperlakukan seperti logout di situs. Untuk mengubah peran (admin /
        moderator / anggota), buka{" "}
        <Link
          href="/admin/management"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Manajemen admin
        </Link>
        .
      </p>

      {banState?.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          {banState.error}
        </div>
      )}
      {banState?.success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-200">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          {banState.banned
            ? "Akun berhasil diblokir."
            : "Blokir berhasil dicabut."}
        </div>
      )}
      {roleState?.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          {roleState.error}
        </div>
      )}
      {roleState?.success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-200">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          Peran akun berhasil diubah.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--border-primary)] text-[var(--text-muted)]">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">
                Email
              </th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold w-40">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
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
                  </td>
                  <td className="px-4 py-3">
                    {!a.is_active ? (
                      <span className="text-xs font-semibold text-slate-500">
                        Nonaktif
                      </span>
                    ) : a.banned ? (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Terblokir
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-[var(--text-muted)]">
                        Akun kamu
                      </span>
                    ) : !a.is_active ? (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    ) : a.banned ? (
                      <form action={banAction}>
                        <input type="hidden" name="account_id" value={a.id} />
                        <input type="hidden" name="banned" value="false" />
                        <button
                          type="submit"
                          disabled={banPending}
                          className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50"
                        >
                          Cabut blokir
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setRoleOpenId(roleOpenId === a.id ? null : a.id)}
                          className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          Ubah peran
                        </button>
                        {roleOpenId === a.id && (
                          <form
                            action={roleAction}
                            className="p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-muted)] space-y-2"
                          >
                            <input
                              type="hidden"
                              name="account_id"
                              value={a.id}
                            />
                            <div className="text-[10px] text-[var(--text-muted)]">
                              Peran saat ini: <span className="font-semibold capitalize">{a.role}</span>
                            </div>
                            <fieldset className="space-y-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="role"
                                  value="user"
                                  defaultChecked={a.role === "user"}
                                />
                                <span className="text-xs">Anggota</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="role"
                                  value="moderator"
                                  defaultChecked={a.role === "moderator"}
                                />
                                <span className="text-xs">Moderator</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="role"
                                  value="admin"
                                  defaultChecked={a.role === "admin"}
                                />
                                <span className="text-xs">Admin</span>
                              </label>
                            </fieldset>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={rolePending}
                                className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setRoleOpenId(null)}
                                className="px-2 py-1 text-xs text-[var(--text-secondary)]"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenId(openId === a.id ? null : a.id)
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Ban size={12} />
                          Blokir
                        </button>
                        {openId === a.id && (
                          <form
                            action={banAction}
                            className="p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-muted)] space-y-2"
                          >
                            <input
                              type="hidden"
                              name="account_id"
                              value={a.id}
                            />
                            <input type="hidden" name="banned" value="true" />
                            <label className="block text-[10px] text-[var(--text-muted)]">
                              Alasan (opsional)
                              <textarea
                                name="reason"
                                rows={2}
                                maxLength={500}
                                className="mt-1 w-full text-xs rounded border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-2 py-1"
                                placeholder="Contoh: spam komentar"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={banPending}
                                className="px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                              >
                                Konfirmasi blokir
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenId(null)}
                                className="px-2 py-1 text-xs text-[var(--text-secondary)]"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-4">
        Alasan blokir dan waktu tercatat di basis data untuk kebutuhan audit
        internal.
      </p>
    </div>
  );
}
