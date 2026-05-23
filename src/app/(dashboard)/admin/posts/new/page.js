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
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Newspaper size={22} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-foreground">
              Posting baru
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Publikasikan kegiatan (jadwal + berita) atau album dokumentasi ke
            galeri foto.
          </p>
        </div>
      </div>

      <AdminPostForm />
    </div>
  );
}
