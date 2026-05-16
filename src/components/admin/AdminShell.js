"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Newspaper,
  Settings,
  Sparkles,
  FileText,
  Shield,
  Briefcase,
  Wallet,
  GraduationCap,
  Mails,
  UserCog,
  Ticket,
  Award,
  Package,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, end: true },
  { href: "/admin/panduan", label: "Panduan pengurus", icon: GraduationCap },
  { href: "/admin/analytics", label: "Traffic", icon: BarChart3 },
  { href: "/admin/users", label: "Akun & blokir", icon: Users },
  { href: "/admin/management", label: "Manajemen admin", icon: UserCog },
  { href: "/admin/finance", label: "Keuangan", icon: Wallet },
  { href: "/admin/posts", label: "Kelola postingan", icon: Newspaper },
  { href: "/admin/settings", label: "Pengaturan situs", icon: Settings },
  { href: "/admin/programs", label: "Program unggulan", icon: Sparkles },
  { href: "/admin/content", label: "Content CMS", icon: FileText },
  { href: "/admin/agenda-surat", label: "Agenda & arsip surat", icon: Mails },
  { href: "/admin/vouchers", label: "Voucher", icon: Ticket },
  { href: "/admin/certificates", label: "Sertifikat", icon: Award },
  { href: "/admin/inventory", label: "Inventaris", icon: Package },
  { href: "/admin/permissions", label: "Role & izin", icon: Shield },
  { href: "/admin/jabatan", label: "Struktur jabatan", icon: Briefcase },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[var(--surface-app)]">
      <div className="md:hidden sticky top-16 z-40 border-b border-[var(--border-primary)] bg-[var(--surface-elevated)]/95 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto px-2 py-2">
          {links.map(({ href, label, icon: Icon, end }) => {
            const active = end
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 min-w-0">
        <aside className="w-56 shrink-0 border-r border-[var(--border-primary)] bg-[var(--surface-elevated)] hidden md:flex flex-col">
          <div className="p-4 border-b border-[var(--border-primary)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Panel admin
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Dewan Ambalan
            </p>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {links.map(({ href, label, icon: Icon, end }) => {
              const active = end
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-100 dark:bg-emerald-900/35 text-emerald-800 dark:text-emerald-200"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon size={17} className="shrink-0 opacity-90" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-primary)]">
            Traffic &amp; secret env: lihat{" "}
            <span className="font-mono">Kitab_Suci_Agent.txt</span> butir 12 ·
            cara pakai panel: <span className="font-mono">/admin/panduan</span>
          </div>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
