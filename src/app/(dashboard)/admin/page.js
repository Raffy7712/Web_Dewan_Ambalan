import Link from "next/link";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { getPageViewAnalytics } from "@/lib/admin-queries";
import {
  Briefcase,
  Settings,
  FileText,
  Shield,
  Sparkles,
  Newspaper,
  Users,
  BarChart3,
  Wallet,
  BookOpen,
  Mails,
  UserCog,
  Ticket,
  Award,
  Package,
} from "lucide-react";

const modules = [
  {
    href: "/admin/panduan",
    title: "Panduan pengurus",
    description: "Ringkasan cara pakai panel admin untuk pengurus baru.",
    icon: BookOpen,
  },
  {
    href: "/admin/analytics",
    title: "Traffic & statistik",
    description: "Kunjungan per halaman, tren harian, jalur populer.",
    icon: BarChart3,
  },
  {
    href: "/admin/users",
    title: "Akun & blokir",
    description: "Lihat pengguna, blokir akun bermasalah, cabut blokir.",
    icon: Users,
  },
  {
    href: "/admin/management",
    title: "Manajemen admin",
    description: "Tetapkan peran anggota, moderator, atau admin (dengan pengaman admin terakhir).",
    icon: UserCog,
  },
  {
    href: "/admin/finance",
    title: "Laporan keuangan",
    description:
      "Perbarui kas per bulan, transaksi, dan publikasi transparansi ke anggota.",
    icon: Wallet,
  },
  {
    href: "/admin/posts",
    title: "Kelola postingan",
    description: "Lihat, edit, hapus, atau ubah status berita dan galeri.",
    icon: Newspaper,
  },
  {
    href: "/admin/settings",
    title: "Pengaturan situs",
    description: "Registrasi akun, seleksi calon pengurus, masa bakti.",
    icon: Settings,
  },
  {
    href: "/admin/programs",
    title: "Program unggulan",
    description: "Kartu fokus kegiatan di beranda portal.",
    icon: Sparkles,
  },
  {
    href: "/admin/content",
    title: "Content CMS",
    description: "Teks landing, home, organisasi, footer, halaman seleksi.",
    icon: FileText,
  },
  {
    href: "/admin/agenda-surat",
    title: "Agenda & arsip surat",
    description: "Surat masuk & keluar internal dewan (tidak dipublikasikan).",
    icon: Mails,
  },
  {
    href: "/admin/vouchers",
    title: "Voucher",
    description: "Generate dan kelola voucher dengan kode unik, verifikasi, dan tracking.",
    icon: Ticket,
  },
  {
    href: "/admin/certificates",
    title: "Sertifikat",
    description: "Generate dan kelola sertifikat, QR code, nomor sertifikat, dan verifikasi publik.",
    icon: Award,
  },
  {
    href: "/admin/inventory",
    title: "Inventaris sarpras",
    description: "Kelola inventaris barang, riwayat perawatan, pengecekan berkala, dan export.",
    icon: Package,
  },
  {
    href: "/admin/permissions",
    title: "Role & izin",
    description: "Permission granular per role.",
    icon: Shield,
  },
  {
    href: "/admin/jabatan",
    title: "Struktur jabatan",
    description: "Kelola jabatan untuk anggota.",
    icon: Briefcase,
  },
];

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/anggota");

  let traffic = { ok: false };
  try {
    traffic = await getPageViewAnalytics();
  } catch (err) {
    console.error("[admin] getPageViewAnalytics error:", err.message);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
        Ringkasan admin
      </h1>
      <p className="text-[var(--text-secondary)] mb-6">
        Konten, pengguna, traffic, dan pengaturan situs dalam satu panel.
      </p>

      {traffic.ok && traffic.totals && (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Page views (24 jam)
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {traffic.totals.last24h.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Page views (7 hari)
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {traffic.totals.last7d.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {modules.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-xl p-5 hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
              <Icon size={18} />
            </div>
            <h2 className="font-bold text-[var(--text-primary)]">{title}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
