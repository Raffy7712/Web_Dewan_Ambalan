"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateRegistrationSettingAction,
  updateAmbalanPortalSettingsAction,
} from "@/app/actions/admin";

export default function SettingsManager({
  initialRegistrationEnabled,
  initialAmbalanRegistrationEnabled,
  initialMasaBakti,
}) {
  const router = useRouter();

  const [regState, regAction, regPending] = useActionState(
    updateRegistrationSettingAction,
    null,
  );
  const registrationEnabled =
    regState?.enabled ?? initialRegistrationEnabled;

  const [ambState, ambAction, ambPending] = useActionState(
    updateAmbalanPortalSettingsAction,
    null,
  );

  const ambalanEnabled =
    ambState?.ambalanEnabled ?? initialAmbalanRegistrationEnabled;
  const masaDisplay =
    ambState?.masaBaktiDisplay ?? initialMasaBakti.display;
  const masaPeriodKey =
    ambState?.masaBaktiPeriodKey ?? initialMasaBakti.period_key;

  useEffect(() => {
    if (regState?.success) router.refresh();
  }, [regState?.success, router]);

  useEffect(() => {
    if (ambState?.success) router.refresh();
  }, [ambState?.success, router]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Site Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Kontrol perilaku global website dari dashboard admin.
        </p>
      </div>

      <form
        action={regAction}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Registrasi akun portal
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Jika nonaktif, halaman register ditutup dan backend menolak
              pendaftaran akun baru.
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              registrationEnabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {registrationEnabled ? "Aktif" : "Nonaktif"}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="enabled"
            value="true"
            disabled={regPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            Aktifkan registrasi
          </button>
          <button
            type="submit"
            name="enabled"
            value="false"
            disabled={regPending}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            Tutup registrasi
          </button>
        </div>
        {regState?.error && (
          <p className="text-sm text-red-500">{regState.error}</p>
        )}
        {regState?.success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {regState.success}
          </p>
        )}
      </form>

      <form
        action={ambAction}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Seleksi calon pengurus ambalan
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Mengatur form <span className="font-mono text-xs">/daftar-ambalan</span>
              , CTA di beranda, dan teks masa bakti.
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              ambalanEnabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {ambalanEnabled ? "Dibuka" : "Ditutup"}
          </span>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="ambalan_enabled"
            defaultChecked={ambalanEnabled}
            className="h-4 w-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Buka akses form pendaftaran seleksi calon pengurus
          </span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Masa bakti (tampilan)
            </span>
            <input
              name="masa_bakti_display"
              defaultValue={masaDisplay}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              placeholder="2026/2027"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Kunci periode database
            </span>
            <input
              name="masa_bakti_period_key"
              defaultValue={masaPeriodKey}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono"
              placeholder="2026-2027"
            />
            <p className="text-xs text-slate-500 mt-1">
              Harus cocok dengan unik pendaftaran per akun; ubah hanya saat ganti
              periode resmi.
            </p>
          </label>
        </div>

        <button
          type="submit"
          disabled={ambPending}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60 text-sm"
        >
          {ambPending ? "Menyimpan…" : "Simpan pengaturan seleksi & masa bakti"}
        </button>

        {ambState?.error && (
          <p className="text-sm text-red-500">{ambState.error}</p>
        )}
        {ambState?.success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {ambState.success}
          </p>
        )}
      </form>
    </main>
  );
}
