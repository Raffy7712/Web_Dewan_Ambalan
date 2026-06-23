"use client";

import { useActionState, useEffect } from "react";
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
            <span className="text-sm font-medium text-foreground">
              Judul
            </span>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={initialPost.title}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Judul singkat yang menarik"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Slug URL (tidak dapat diubah)
            </span>
            <input
              type="text"
              value={initialPost.slug}
              disabled
              className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground mt-1 block">
              Slug ini tidak dapat diubah untuk menjaga URL publik tetap stabil.
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Ringkasan
            </span>
            <textarea
              name="description"
              required
              rows={3}
              maxLength={500}
              defaultValue={initialPost.description}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="1–3 kalimat untuk daftar berita dan email notifikasi"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Isi lengkap (opsional)
            </span>
            <textarea
              name="content"
              rows={8}
              defaultValue={initialPost.content || ""}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Narasi di halaman detail (boleh kosong untuk album foto saja)"
            />
          </label>
        </div>

        {initialPost.category === "kegiatan" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Tanggal kegiatan
              </span>
              <input
                type="date"
                name="event_date"
                required
                defaultValue={initialPost.event_date || ""}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Lokasi
              </span>
              <input
                name="event_location"
                required
                defaultValue={initialPost.event_location || ""}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Lapangan sekolah / Bumi perkemahan …"
              />
            </label>
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <ImagePlus size={16} />
              URL foto (Google Drive)
            </span>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Minimal 1, maksimal 10 URL foto. Satu URL per baris. Foto pertama menjadi sampul. Mengubah akan menghapus semua foto lama.
            </p>
            <textarea
              name="image_urls"
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono"
              placeholder="https://drive.google.com/uc?id=...&#10;https://drive.google.com/uc?id=..."
              defaultValue={(initialPost.post_media
                ?.filter((m) => m.media_type === "image")
                .map((m) => m.url) || []).join("\n")}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Video size={16} />
              URL video (Google Drive, opsional)
            </span>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Maksimal 5 URL video. Satu URL per baris.
            </p>
            <textarea
              name="video_urls"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono"
              placeholder="https://drive.google.com/uc?id=..."
              defaultValue={(initialPost.post_media
                ?.filter((m) => m.media_type === "video")
                .map((m) => m.url) || []).join("\n")}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="notify_email"
            defaultChecked
            className="h-4 w-4 rounded border-border text-emerald-600"
          />
          <span className="text-sm text-foreground">
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
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
