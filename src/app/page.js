import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { Award, ScrollText, FileText, Ticket, ShieldCheck } from "lucide-react";

const JENIS = [
  { key: "sertifikat", label: "Sertifikat", icon: Award, desc: "Penghargaan dan kelulusan kegiatan pramuka." },
  { key: "piagam", label: "Piagam", icon: ScrollText, desc: "Piagam penghargaan resmi dewan ambalan." },
  { key: "surat", label: "Surat", icon: FileText, desc: "Surat resmi, tugas, atau keterangan." },
  { key: "voucher", label: "Voucher", icon: Ticket, desc: "Voucher program dan bantuan ambalan." },
];

export const metadata = {
  title: "Verifikasi Keaslian Dokumen | Dewan Ambalan",
  description:
    "Portal verifikasi keaslian dokumen (sertifikat, piagam, surat, voucher) Dewan Ambalan Pramuka Penegak SMK Al Furqon Bantarkawung.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
              <LogoImage size={36} />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-primary text-[10px] font-semibold uppercase tracking-wider leading-none">
                Gugus Depan Brebes 02.165 / 02.166
              </p>
              <p className="text-foreground text-sm font-bold leading-tight">
                Dewan Ambalan SMK Al Furqon
              </p>
            </div>
          </Link>
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
          >
            <ShieldCheck size={16} />
            Verifikasi
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-12 sm:py-16 md:py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <ShieldCheck size={14} />
              Verifikasi Keaslian Dokumen
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-3">
              Dewan Ambalan Pramuka Penegak
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Cek keaslian sertifikat, piagam, surat, dan voucher yang diterbitkan
              oleh Dewan Ambalan SMK Al Furqon Bantarkawung. Masukkan kode dokumen
              untuk memastikan dokumen sah dan belum dibatalkan.
            </p>
            <Link
              href="/verify"
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors"
            >
              Mulai Verifikasi
            </Link>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {JENIS.map(({ key, label, icon: Icon, desc }) => (
              <Link
                key={key}
                href={`/verify?jenis=${key}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary transition-colors flex flex-col"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon size={22} />
                </div>
                <h2 className="font-bold text-foreground text-sm">{label}</h2>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed flex-1">
                  {desc}
                </p>
                <span className="mt-3 text-primary text-xs font-semibold group-hover:underline">
                  Verifikasi {label} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-6 h-6 rounded bg-primary overflow-hidden flex items-center justify-center">
            <LogoImage size={24} />
          </div>
          <p className="font-bold text-sm text-foreground">
            Dewan Ambalan SMK Al Furqon Bantarkawung
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          Gugus Depan Brebes 02.165 / 02.166 &middot; Kwartir Ranting Bantarkawung
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          &copy; {new Date().getFullYear()} Dewan Ambalan. Semua hak dilindungi.
        </p>
      </footer>
    </div>
  );
}
