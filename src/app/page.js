import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { Award, ScrollText, FileText, Ticket, ShieldCheck, ArrowRight } from "lucide-react";

const JENIS = [
  { code: "SRT", label: "Sertifikat", icon: Award, desc: "Penghargaan dan kelulusan kegiatan pramuka." },
  { code: "PIG", label: "Piagam", icon: ScrollText, desc: "Piagam penghargaan resmi dewan ambalan." },
  { code: "SUR", label: "Surat", icon: FileText, desc: "Surat resmi, tugas, atau keterangan." },
  { code: "VCH", label: "Voucher", icon: Ticket, desc: "Voucher program dan bantuan ambalan." },
];

const LANGKAH = [
  { n: "1", title: "Masukkan Kode", desc: "Ketik kode unik yang tertera pada dokumen, misal SRT-2026-AB12CD." },
  { n: "2", title: "Pindai Otomatis", desc: "Sistem memeriksa keaslian dokumen ke database resmi Dewan Ambalan." },
  { n: "3", title: "Lihat Hasil", desc: "Dapatkan status dokumen beserta detail dan QR code verifikasi." },
];

export const metadata = {
  title: "Verifikasi Keaslian Dokumen | Dewan Ambalan",
  description:
    "Portal verifikasi keaslian dokumen (sertifikat, piagam, surat, voucher) Dewan Ambalan Pramuka Penegak SMK Al Furqon Bantarkawung.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FBF6EE] text-[#3A2E25]">
      <header className="sticky top-0 z-50 bg-[#FBF6EE]/90 backdrop-blur border-b border-[#E5DDD0]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#5B3A1F] flex items-center justify-center overflow-hidden">
              <LogoImage size={28} />
            </div>
            <span className="font-bold text-[#3A2E25] text-sm">Dewan Ambalan</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/verify"
              className="text-sm font-medium text-[#6B5E52] hover:text-[#5B3A1F] transition-colors"
            >
              Verifikasi
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-[#6B5E52] hover:text-[#5B3A1F] transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#5B3A1F] hover:bg-[#4A2F18] text-[#FBF6EE] text-sm font-semibold transition-colors"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 pt-14 sm:pt-20 md:pt-24 pb-12 sm:pb-16 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#EDE3D6] text-[#5B3A1F] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
              <ShieldCheck size={14} />
              Layanan Resmi Dewan Ambalan
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight">
              Verifikasi Keaslian Dokumen Pramuka dalam satu tap.
            </h1>
            <p className="mt-5 text-[#6B5E52] text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Cek keaslian sertifikat, piagam, surat, dan voucher yang diterbitkan
              oleh Dewan Ambalan SMK Al Furqon Bantarkawung. Pastikan dokumen sah
              dan belum dibatalkan hanya dengan kode dokumen.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/verify"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-[#5B3A1F] hover:bg-[#4A2F18] text-[#FBF6EE] font-semibold text-sm transition-colors"
              >
                Mulai Verifikasi
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-[#E5DDD0] text-[#3A2E25] hover:border-[#5B3A1F] font-semibold text-sm transition-colors"
              >
                Masuk Admin
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {JENIS.map(({ code, label, icon: Icon, desc }) => (
              <Link
                key={code}
                href={`/verify?jenis=${label.toLowerCase()}`}
                className="group rounded-2xl border border-[#E5DDD0] bg-white p-5 shadow-sm hover:border-[#5B3A1F] transition-colors flex flex-col"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EDE3D6] text-[#5B3A1F] flex items-center justify-center mb-3">
                  <Icon size={22} />
                </div>
                <div className="inline-flex w-fit items-center bg-[#EDE3D6] text-[#5B3A1F] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2">
                  {code}
                </div>
                <h2 className="font-bold text-[#3A2E25] text-sm">{label}</h2>
                <p className="text-[#6B5E52] text-xs mt-1 leading-relaxed flex-1">
                  {desc}
                </p>
                <span className="mt-3 text-[#5B3A1F] text-xs font-semibold group-hover:underline">
                  Verifikasi {label} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-8">
              Cara Verifikasi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LANGKAH.map(({ n, title, desc }) => (
                <div
                  key={n}
                  className="rounded-2xl border border-[#E5DDD0] bg-white p-6 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-full bg-[#5B3A1F] text-[#FBF6EE] flex items-center justify-center font-bold text-sm mb-4">
                    {n}
                  </div>
                  <h3 className="font-bold text-[#3A2E25] text-sm">{title}</h3>
                  <p className="text-[#6B5E52] text-xs mt-1.5 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#5B3A1F] text-[#FBF6EE]">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>&copy; 2026 Dewan Ambalan &mdash; Layanan Verifikasi Resmi</p>
          <p className="opacity-80">Kementerian Pramuka</p>
        </div>
      </footer>
    </div>
  );
}