import Link from "next/link";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import AdminPostForm from "../AdminPostForm";

export default async function AdminNewPostPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Newspaper size={22} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Posting baru
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
            Publikasikan kegiatan (jadwal + berita) atau album dokumentasi ke
            galeri foto.
          </p>
        </div>
      </div>

      <AdminPostForm />
    </div>
  );
}
