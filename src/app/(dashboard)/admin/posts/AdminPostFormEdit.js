"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateAdminPostAction } from "@/app/actions/posts";
import {
  AlertCircle,
  CheckCircle,
  ImagePlus,
  Newspaper,
  Send,
  Video,
} from "lucide-react";

export default function AdminPostFormEdit({ initialPost }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    (prevState, formData) => updateAdminPostAction(initialPost.id, prevState, formData),
    null,
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  const imageUrls = initialPost.post_media
    ?.filter((m) => m.media_type === "image")
    .map((m) => m.url)
    .join("\n") || "";

  const videoUrls = initialPost.post_media
    ?.filter((m) => m.media_type === "video")
    .map((m) => m.url)
    .join("\n") || "";

  return (
    <div className="space-y-6">
      {state?.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          {state.error}
        </div>
      )}
      {state?.success && state.slug && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{state.message}</p>
          </div>
          <Link
            href={`/berita/${state.slug}`}
            className="inline-flex w-fit items-center gap-2 font-semibold text-emerald-700 underline dark:text-emerald-300"
          >
            <Newspaper size={16} />
            Lihat postingan
          </Link>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Judul
            </span>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={initialPost.title}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Judul singkat yang menarik"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Slug URL (tidak dapat diubah)
            </span>
            <input
              type="text"
              value={initialPost.slug}
              disabled
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-mono text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
            />
            <span className="text-xs text-slate-500 mt-1 block">
              Slug ini tidak dapat diubah untuk menjaga URL publik tetap stabil.
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Ringkasan
            </span>
            <textarea
              name="description"
              required
              rows={3}
              maxLength={500}
              defaultValue={initialPost.description}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="1–3 kalimat untuk daftar berita dan email notifikasi"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Isi lengkap (opsional)
            </span>
            <textarea
              name="content"
              rows={8}
              defaultValue={initialPost.content || ""}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Narasi di halaman detail (boleh kosong untuk album foto saja)"
            />
          </label>
        </div>

        {initialPost.category === "kegiatan" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Tanggal kegiatan
              </span>
              <input
                type="date"
                name="event_date"
                required
                defaultValue={initialPost.event_date || ""}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Lokasi
              </span>
              <input
                name="event_location"
                required
                defaultValue={initialPost.event_location || ""}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Lapangan sekolah / Bumi perkemahan …"
              />
            </label>
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <ImagePlus size={16} />
              URL foto (Google Drive) — Ganti semuanya
            </span>
            <p className="text-xs text-slate-500 mt-1 mb-2">
              Satu URL per baris. Minimal 1 dan maksimal 10 tautan (boleh link
              share Drive). Foto pertama menjadi sampul. Mengubah foto akan
              menghapus semua foto lama.
            </p>
            <textarea
              name="image_urls"
              required
              rows={6}
              defaultValue={imageUrls}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder={"https://drive.google.com/file/d/…/view\n…"}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Video size={16} />
              URL video (Google Drive, opsional) — Ganti semuanya
            </span>
            <p className="text-xs text-slate-500 mt-1 mb-2">
              Maksimal 5 video. Satu URL per baris. Kosongkan jika tidak ada.
              Mengubah video akan menghapus semua video lama.
            </p>
            <textarea
              name="video_urls"
              rows={4}
              defaultValue={videoUrls}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="https://drive.google.com/file/d/…/view"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="notify_email"
            defaultChecked
            className="h-4 w-4 rounded border-slate-400 text-emerald-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Kirim email notifikasi tentang perubahan ke semua akun dengan alamat
            email terdaftar
          </span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Send size={16} />
            )}
            {pending ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
