import Link from "next/link";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getFeaturedProgramsAdmin } from "@/lib/admin-queries";
import FeaturedProgramsManager from "./FeaturedProgramsManager";

export default async function AdminProgramsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const programs = await getFeaturedProgramsAdmin();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-foreground">
              Program unggulan
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Kartu fokus kegiatan di beranda portal (/home), dari tabel{" "}
            <code className="text-xs">featured_programs</code>.
          </p>
        </div>
      </div>

      <FeaturedProgramsManager initialPrograms={programs} />
    </div>
  );
}
