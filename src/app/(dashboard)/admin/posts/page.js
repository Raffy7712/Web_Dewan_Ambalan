"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllAdminPostsAction, deletePostAction, togglePostStatusAction } from "@/app/actions/posts";
import {
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  AlertCircle,
} from "lucide-react";

export default function AdminPostsListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getAllAdminPostsAction();
      setPosts(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(postId, title) {
    if (
      !window.confirm(
        `Hapus postingan "${title}"? Semua komentar akan otomatis terhapus.`,
      )
    ) {
      return;
    }

    setDeleting(postId);
    const result = await deletePostAction(postId);
    setDeleting(null);

    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      router.refresh();
    } else {
      setError(result.error || "Gagal menghapus postingan");
    }
  }

  async function handleToggleStatus(postId, currentStatus) {
    setToggling(postId);
    const result = await togglePostStatusAction(postId);
    setToggling(null);

    if (result.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, status: result.newStatus } : p,
        ),
      );
      router.refresh();
    } else {
      setError(result.error || "Gagal mengubah status");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Kelola Postingan
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Total: {posts.length} postingan
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Postingan Baru
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            Belum ada postingan.{" "}
            <Link href="/admin/posts/new" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Buat postingan pertama
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--surface-elevated)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                  Judul
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                  Penulis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                  Dipublikasi
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[var(--border-primary)] hover:bg-[rgba(16,185,129,0.05)] dark:hover:bg-emerald-900/10 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {post.category === "kegiatan"
                        ? "Kegiatan"
                        : post.category === "pengumuman"
                          ? "Pengumuman"
                          : post.category === "galeri"
                            ? "Galeri"
                            : "Prestasi"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 font-medium ${
                        post.status === "published"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {post.status === "published" ? "Dipublikasi" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {post.accounts?.display_name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        title="Edit"
                        className="rounded p-1.5 hover:bg-[rgba(16,185,129,0.1)] dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        <Edit2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </Link>
                      <button
                        onClick={() =>
                          handleToggleStatus(post.id, post.status)
                        }
                        disabled={toggling === post.id}
                        title={
                          post.status === "published"
                            ? "Jadikan draft"
                            : "Publikasikan"
                        }
                        className="rounded p-1.5 hover:bg-[rgba(16,185,129,0.1)] disabled:opacity-50 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        {post.status === "published" ? (
                          <Eye size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <EyeOff size={16} className="text-yellow-600 dark:text-yellow-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={deleting === post.id}
                        title="Hapus"
                        className="rounded p-1.5 hover:bg-red-100 disabled:opacity-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
