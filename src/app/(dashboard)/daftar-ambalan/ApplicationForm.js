"use client";

import { useActionState } from "react";
import { submitAmbalanApplicationAction } from "@/app/actions/ambalan";
import { AlertCircle, CheckCircle, Send } from "lucide-react";

const inputCls =
  "w-full border border-gray-300 dark:border-purple-700 bg-white dark:bg-[#1e1640] text-gray-900 dark:text-purple-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 dark:placeholder-purple-600 transition";

export default function ApplicationForm({ user, application }) {
  const [state, formAction, pending] = useActionState(
    submitAmbalanApplicationAction,
    null,
  );
  const submitted = state?.success || application;

  return (
    <form
      action={formAction}
      className="bg-white dark:bg-[#150f2d] border border-emerald-100 dark:border-purple-900/40 rounded-xl p-5 md:p-6 space-y-4"
    >
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {state.error}
        </div>
      )}
      {submitted && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          {state?.success ??
            `Pendaftaran kamu berstatus ${application.status}. Kamu masih bisa memperbarui data selama seleksi belum ditutup.`}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-purple-300">
            Nama Lengkap
          </span>
          <input
            name="full_name"
            defaultValue={application?.full_name ?? user.display_name}
            required
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-purple-300">
            Kelas
          </span>
          <input
            name="class_name"
            defaultValue={application?.class_name ?? ""}
            required
            placeholder="XI TKJ 1"
            className={inputCls}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-purple-300">
          Nomor WhatsApp
        </span>
        <input
          name="phone"
          defaultValue={application?.phone ?? ""}
          required
          inputMode="tel"
          placeholder="08xxxxxxxxxx"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-purple-300">
          Motivasi ikut seleksi pengurus ambalan
        </span>
        <textarea
          name="motivation"
          defaultValue={application?.motivation ?? ""}
          required
          rows={5}
          minLength={40}
          maxLength={800}
          placeholder="Ceritakan alasan, komitmen, dan kontribusi yang ingin kamu bawa untuk program ambalan."
          className={`${inputCls} resize-none`}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-purple-300">
          Pengalaman Kepramukaan
        </span>
        <textarea
          name="experience"
          defaultValue={application?.experience ?? ""}
          rows={4}
          maxLength={800}
          placeholder="Contoh: pernah ikut kemah, lomba, pelatihan, panitia kegiatan, atau pengalaman organisasi lain."
          className={`${inputCls} resize-none`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
      >
        {pending ? (
          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {pending ? "Mengirim..." : "Kirim Pendaftaran"}
      </button>
    </form>
  );
}
