"use client";
import Link from "next/link";
import LogoImage from "./LogoImage";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Newspaper,
  CalendarDays,
  Users,
  ImageIcon,
  UserCircle,
  Shield,
  Wallet,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/berita", label: "Berita", icon: Newspaper },
  { href: "/kegiatan", label: "Kegiatan", icon: CalendarDays },
  { href: "/anggota", label: "Struktur", icon: Users },
  { href: "/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/galeri", label: "Galeri", icon: ImageIcon },
];

export default function Navbar({ isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visibleNavLinks = isAdmin
    ? [...navLinks, { href: "/admin", label: "Admin", icon: Shield }]
    : navLinks;

  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface-elevated)] border-b border-[var(--border-primary)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 flex-shrink-0 group"
          onClick={() => setOpen(false)}
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
            <LogoImage size={36} />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider leading-none">
              Gudep Brebes 02.165 / 02.166
            </p>
            <p className="text-[var(--text-secondary)] text-[11px] leading-tight mt-0.5">
              Dewan Ambalan SMK Al Furqon Bantarkawung
            </p>
            <p className="text-[var(--text-primary)] text-sm font-bold leading-tight">
              SMK Al Furqon
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {visibleNavLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <Icon size={16} />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Profile link (desktop) */}
          <Link
            href="/profil"
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
            title="Profil"
          >
            <UserCircle size={20} />
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[var(--surface-elevated)] border-t border-[var(--border-primary)] px-4 py-3 flex flex-col gap-1">
          {visibleNavLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-all"
          >
            <UserCircle size={18} />
            Profil
          </Link>
        </div>
      )}
    </nav>
  );
}
