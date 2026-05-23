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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Kelola Postingan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {posts.length} postingan
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
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
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Belum ada postingan.{" "}
            <Link href="/admin/posts/new" className="font-semibold text-primary hover:underline">
              Buat postingan pertama
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Judul
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Penulis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Dipublikasi
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border hover:bg-primary/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-block rounded-full bg-muted text-foreground">
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
                          ? "bg-primary/10 text-primary"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {post.status === "published" ? "Dipublikasi" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {post.accounts?.display_name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
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
                        className="rounded p-1.5 hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 size={16} className="text-primary" />
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
                        className="rounded p-1.5 hover:bg-primary/10 disabled:opacity-50 transition-colors"
                      >
                        {post.status === "published" ? (
                          <Eye size={16} className="text-primary" />
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
