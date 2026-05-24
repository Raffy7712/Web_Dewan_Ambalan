import Link from "next/link";
import LogoImage from "./LogoImage";
import { MapPin, Mail, Globe, ExternalLink } from "lucide-react";

export default function Footer() {
  const navLinks = [
    { href: "/home", label: "Beranda" },
    { href: "/berita", label: "Berita & Artikel" },
    { href: "/kegiatan", label: "Jadwal Kegiatan" },
    { href: "/keuangan", label: "Transparansi Keuangan" },
    { href: "/anggota", label: "Struktur Dewan Ambalan" },
    { href: "/galeri", label: "Galeri Foto" },
    { href: "/vouchers", label: "Verifikasi Voucher & Sertifikat" },
  ];

  return (
    <footer className="bg-slate-950 text-foreground border-t border-primary/30 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <Link
            href="/home"
            className="flex items-center gap-2.5 mb-4 group w-fit"
          >
            <div className="w-9 h-9 rounded-md overflow-hidden bg-accent flex items-center justify-center flex-shrink-0">
              <LogoImage size={36} />
            </div>
            <div>
              <p className="text-primary text-[10px] font-semibold uppercase tracking-wider leading-tight">
                Gudep Brebes 02.165 / 02.166
              </p>
              <p className="text-white font-bold text-sm leading-tight mt-1">
                Dewan Ambalan SMK Al Furqon Bantarkawung
              </p>
              <p className="text-primary text-xs font-semibold mt-0.5">SMK Al Furqon</p>
            </div>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Kwartir Ranting Bantarkawung · Kwartir Cabang Brebes.
          </p>
          <p className="text-accent text-xs mt-3 italic font-medium">&ldquo;Satyaku Kudarmakan, Darmaku Kubaktikan&rdquo;</p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
            Navigasi
          </h4>
          <ul className="space-y-2">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                className="text-muted-foreground hover:text-white text-sm transition-colors flex items-center gap-1.5 group"
                >
                  <ExternalLink
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
            Kontak
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <MapPin
                size={15}
                className="flex-shrink-0 mt-0.5 text-accent"
              />
              Jl. Raya Bantarkawung, Brebes, Jawa Tengah 52274
            </li>
            <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail size={15} className="flex-shrink-0 text-accent" />
              <a
                href="mailto:praskaba7@gmail.com"
                className="hover:text-white transition-colors"
              >
                praskaba7@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Globe size={15} className="flex-shrink-0 text-accent" />
              <a
                href="https://da-alf.web.id"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                da-alf.web.id
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary/30 py-4 px-4 text-center">
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Dewan Ambalan SMK Al Furqon
          Bantarkawung. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}
