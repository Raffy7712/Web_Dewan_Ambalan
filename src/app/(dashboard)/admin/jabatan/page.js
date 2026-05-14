import { getSession } from "@/app/actions/auth";
import { getJabatanList } from "@/lib/queries";
import { redirect } from "next/navigation";
import JabatanManager from "./JabatanManager";
import { Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function JabatanAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  const jabatanList = await getJabatanList();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="p-2 rounded-xl hover:bg-[var(--surface-muted)] text-[var(--text-muted)] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Kelola Jabatan
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            Tambah, hapus, dan atur urutan jabatan Dewan Ambalan
          </p>
        </div>
      </div>

      <JabatanManager initialJabatan={jabatanList} />
    </div>
  );
}
