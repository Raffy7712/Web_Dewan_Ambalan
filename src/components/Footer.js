import Link from "next/link";
import LogoImage from "./LogoImage";
import { MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react";
import { getCmsText, isAmbalanRegistrationEnabled } from "@/lib/cms";
import { getSiteContact } from "@/lib/site-contact";

export default async function Footer() {
  const { phone: contactPhone, email: contactEmail, websiteHref, websiteLabel, addressLine } =
    getSiteContact();
  const showSeleksi = await isAmbalanRegistrationEnabled();
  const navLinks = [
    { href: "/home", label: "Beranda" },
    { href: "/berita", label: "Berita & Artikel" },
    { href: "/kegiatan", label: "Jadwal Kegiatan" },
    { href: "/keuangan", label: "Transparansi Keuangan" },
    { href: "/anggota", label: "Struktur Dewan Ambalan" },
    ...(showSeleksi
      ? [{ href: "/daftar-ambalan", label: "Seleksi calon pengurus" }]
      : []),
    { href: "/galeri", label: "Galeri Foto" },
  ];

  const motto = await getCmsText(
    "footer",
    "brand",
    "motto",
    '"Satyaku Kudarmakan, Darmaku Kubaktikan"',
  );

  return (
    <footer className="bg-[var(--surface-contrast)] text-slate-200 border-t border-emerald-900/40 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <Link
            href="/home"
            className="flex items-center gap-2.5 mb-4 group w-fit"
          >
            <div className="w-9 h-9 rounded-md overflow-hidden bg-amber-700 flex items-center justify-center flex-shrink-0">
              <LogoImage size={36} />
            </div>
            <div>
              <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider leading-tight">
                Gudep Brebes 02.165 / 02.166
              </p>
              <p className="text-white font-bold text-sm leading-tight mt-1">
                Dewan Ambalan SMK Al Furqon Bantarkawung
              </p>
              <p className="text-emerald-300 text-xs font-semibold mt-0.5">SMK Al Furqon</p>
            </div>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Kwartir Ranting Bantarkawung · Kwartir Cabang Brebes.
          </p>
          <p className="text-amber-400 text-xs mt-3 italic font-medium">{motto}</p>
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
                className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1.5 group"
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
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <MapPin
                size={15}
                className="flex-shrink-0 mt-0.5 text-amber-500"
              />
              {addressLine}
            </li>
            <li className="flex items-center gap-2.5 text-sm text-slate-400">
              <Phone size={15} className="flex-shrink-0 text-amber-500" />
              {contactPhone}
            </li>
            <li className="flex items-center gap-2.5 text-sm text-slate-400">
              <Mail size={15} className="flex-shrink-0 text-amber-500" />
              <a
                href={`mailto:${contactEmail}`}
                className="hover:text-white transition-colors"
              >
                {contactEmail}
              </a>
            </li>
            <li className="flex items-center gap-2.5 text-sm text-slate-400">
              <Globe size={15} className="flex-shrink-0 text-amber-500" />
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {websiteLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-emerald-900/50 py-4 px-4 text-center">
        <p className="text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} Dewan Ambalan SMK Al Furqon
          Bantarkawung. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}
