"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllAdminPosts } from "@/lib/admin-queries";
import { deletePostAction, togglePostStatusAction } from "@/app/actions/posts";
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
      const data = await getAllAdminPosts();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Kelola Postingan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total: {posts.length} postingan
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">
            Belum ada postingan.{" "}
            <Link href="/admin/posts/new" className="font-semibold text-emerald-600 hover:underline">
              Buat postingan pertama
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Judul
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Penulis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dipublikasi
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                >
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
                      className={`inline-block rounded-full px-2 py-1 ${
                        post.status === "published"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {post.status === "published" ? "Dipublikasi" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {post.accounts?.display_name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
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
                        className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                      >
                        <Edit2 size={16} className="text-slate-600 dark:text-slate-400" />
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
                        className="rounded p-1 hover:bg-slate-200 disabled:opacity-50 dark:hover:bg-slate-800"
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
                        className="rounded p-1 hover:bg-red-100 disabled:opacity-50 dark:hover:bg-red-900/30"
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
