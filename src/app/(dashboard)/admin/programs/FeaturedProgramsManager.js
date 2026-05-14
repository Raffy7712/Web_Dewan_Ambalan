"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addFeaturedProgramAction,
  deleteFeaturedProgramAction,
  toggleFeaturedProgramAction,
  moveFeaturedProgramAction,
} from "@/app/actions/admin";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

export default function FeaturedProgramsManager({ initialPrograms }) {
  const router = useRouter();
  const [addState, addAction, addPending] = useActionState(
    addFeaturedProgramAction,
    null,
  );

  useEffect(() => {
    if (addState?.success) router.refresh();
  }, [addState?.success, router]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Plus size={16} className="text-emerald-600" />
          Tambah program unggulan
        </h2>
        {addState?.error && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={14} /> {addState.error}
          </div>
        )}
        {addState?.success && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
            <CheckCircle size={14} /> {addState.success}
          </div>
        )}
        <form action={addAction} className="space-y-3">
          <input
            name="title"
            required
            placeholder="Judul (contoh: Perkemahan & penjelajahan)"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          />
          <textarea
            name="description"
            rows={3}
            placeholder="Deskripsi singkat"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          />
          <button
            type="submit"
            disabled={addPending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {addPending ? "Menyimpan…" : "Simpan program"}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Daftar program ({initialPrograms.length})
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {initialPrograms.map((p) => (
            <li
              key={p.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {p.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {p.description}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Urutan {p.sort_order} ·{" "}
                  {p.is_active ? "Ditampilkan di home" : "Disembunyikan"}
                </p>
              </div>
              <ProgramRowActions program={p} />
            </li>
          ))}
          {initialPrograms.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Belum ada data. Tambahkan program atau jalankan migration-v5.sql
              untuk data awal.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ProgramRowActions({ program }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(dir) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", program.id);
      fd.set("direction", dir);
      await moveFeaturedProgramAction(null, fd);
      router.refresh();
    });
  }

  function toggle() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", program.id);
      fd.set("is_active", program.is_active ? "false" : "true");
      await toggleFeaturedProgramAction(null, fd);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Hapus program "${program.title}"?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", program.id);
      await deleteFeaturedProgramAction(null, fd);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end opacity-100">
      <button
        type="button"
        disabled={pending}
        onClick={() => move("up")}
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
        title="Naik"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => move("down")}
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
        title="Turun"
      >
        <ChevronDown size={16} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
        title={program.is_active ? "Sembunyikan di home" : "Tampilkan di home"}
      >
        {program.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 disabled:opacity-40"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
