"use client";
import Link from "next/link";
import LogoImage from "./LogoImage";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ScanSearch, ShieldCheck, UserCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const publicNavLinks = [
  { href: "/verify", label: "Verifikasi", icon: ScanSearch },
];

const adminOnlyLinks = [{ href: "/admin", label: "Admin", icon: ShieldCheck }];

export default function Navbar({ isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const visibleNavLinks = isAdmin
    ? [...publicNavLinks, ...adminOnlyLinks]
    : publicNavLinks;

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-3 flex-shrink-0 group"
          onClick={() => setOpen(false)}
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
            <LogoImage size={36} />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-primary text-[10px] font-semibold uppercase tracking-wider leading-none">
              Gugus Depan Brebes 02.165 / 02.166
            </p>
            <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">
              Dewan Ambalan SMK Al Furqon Bantarkawung
            </p>
            <p className="text-foreground text-sm font-bold leading-tight">SMK Al Furqon</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {visibleNavLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const isAdminLink = href === "/admin";
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? isAdminLink
                      ? "bg-secondary/10 text-secondary"
                      : "bg-primary/10 text-primary"
                    : isAdminLink
                      ? "text-secondary hover:bg-secondary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-card border-t border-border px-4 py-3 flex flex-col gap-1">
          {visibleNavLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const isAdminLink = href === "/admin";
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? isAdminLink
                      ? "bg-secondary/10 text-secondary"
                      : "bg-primary/10 text-primary"
                    : isAdminLink
                      ? "text-secondary hover:bg-secondary/5"
                      : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
