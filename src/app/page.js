import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { getRecentPosts, getFeaturedProgramsForPublic } from "@/lib/queries";
import { getCmsText, getCmsEntriesByPage, isRegistrationEnabled } from "@/lib/cms";
import { getDisplayUrl } from "@/lib/media-url";

import {
  Tent,
  Trophy,
  HeartHandshake,
  BookOpen,
  ChevronRight,
  Shield,
  Star,
  Users,
  CalendarCheck,
  MapPin,
  Mail,
  Globe,
} from "lucide-react";

const stats = [
  { angka: "500+", label: "Anggota Penegak", icon: Users },
  { angka: "10+", label: "Kegiatan/Tahun", icon: CalendarCheck },
  { angka: "2026/2027", label: "Masa Bakti", icon: Shield },
  { angka: "10+", label: "Tahun Berdiri", icon: Star },
];

const FEATURE_ICONS = [Tent, Trophy, HeartHandshake, BookOpen];

async function getTentangFeatures() {
  const entries = await getCmsEntriesByPage("landing");
  return entries
    .filter(e => e.section_key === "tentang_features" && e.is_published)
    .map((e, i) => {
      const payload = e.payload || {};
      return {
        icon: FEATURE_ICONS[i % FEATURE_ICONS.length],
        judul: payload.title || "Fitur",
        desc: payload.desc || "",
        color: payload.color || "text-primary",
        bg: payload.bg || "bg-primary/5 border-primary/20",
        iconBg: payload.iconBg || "bg-primary/10",
      };
    });
}

const PROGRAM_ICONS = [Tent, Trophy, HeartHandshake];

/** Fallback jika belum ada baris di `featured_programs`. */
const DEFAULT_LANDING_PROGRAMS = [
  {
    id: "_d1",
    icon: Tent,
    judul: "Kemah bhakti alam",
    desc: "Perkemahan 2–3 hari di alam terbuka untuk pembentukan karakter dan jiwa kepemimpinan penegak.",
    tag: "Contoh",
  },
  {
    id: "_d2",
    icon: Trophy,
    judul: "Pembinaan & pelatihan",
    desc: "Program pembinaan rutin dan pelatihan kecakapan penegak di gugus depan.",
    tag: "Contoh",
  },
  {
    id: "_d3",
    icon: HeartHandshake,
    judul: "Bakti masyarakat",
    desc: "Kegiatan sosial: bersih lingkungan, donor darah, dan pembagian sembako.",
    tag: "Contoh",
  },
];

const categoryConfig = {
  pengumuman: {
    label: "Pengumuman",
    cls: "bg-primary/10 text-primary",
  },
  kegiatan: {
    label: "Kegiatan",
    cls: "bg-accent/10 text-accent",
  },
  prestasi: {
    label: "Prestasi",
    cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
};

function formatTanggal(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function LandingPage() {
  const [
    recentPosts,
    registrationEnabled,
    heroTitle,
    heroSubtitle,
    ctaTitle,
    featuredRows,
    contact,
    tentangTitle,
    tentangP1,
    tentangP2,
    programLead,
    tentangFeatures,
    brandEyebrow,
    brandDewan,
    brandSchoolNav,
  ] = await Promise.all([
    getRecentPosts(3),
    isRegistrationEnabled(),
    getCmsText(
      "landing",
      "hero",
      "title",
      "SMK Al Furqon Bantarkawung",
    ),
    getCmsText(
      "landing",
      "hero",
      "subtitle",
      "Satyaku Kudarmakan, Darmaku Kubaktikan. Bersama membina pramuka penegak yang tangguh, mandiri, dan berakhlak mulia di bumi Bantarkawung.",
    ),
    getCmsText("landing", "cta", "title", "Siap Bergabung?"),
    getFeaturedProgramsForPublic(10),
    Promise.resolve({
      addressLine: "Jl. Raya Bantarkawung, Brebes, Jawa Tengah 52274",
      email: "praskaba7@gmail.com",
      websiteLabel: "da-alf.web.id",
    }),
    getCmsText(
      "landing",
      "tentang",
      "title",
      "Pramuka Penegak di Dewan Ambalan",
    ),
    getCmsText(
      "landing",
      "tentang",
      "p1",
      "Dewan Ambalan Pramuka Penegak SMK Al Furqon Bantarkawung adalah wadah kegiatan kepramukaan tingkat penegak (SMA/SMK) di bawah Gugus Depan Brebes 02.165 - 02.166, Kwartir Ranting Bantarkawung, Kwartir Cabang Brebes, Kwartir Daerah Jawa Tengah.",
    ),
    getCmsText(
      "landing",
      "tentang",
      "p2",
      "Kami membina penegak untuk mengamalkan Tri Satya dan Tri Dharma, mengembangkan kompetensi kepemimpinan, serta mengabdi kepada masyarakat dan alam melalui program kerja dewan ambalan yang selaras tuntunan Gerakan Pramuka.",
    ),
    getCmsText(
      "landing",
      "program",
      "lead",
      "Program di bawah ini dikelola dari panel admin (Program unggulan) dan tampil di beranda portal. Tambah atau ubah agar mencerminkan rencana kerja masa bakti Anda.",
    ),
    getTentangFeatures(),
    getCmsText(
      "landing",
      "brand",
      "eyebrow",
      "Gugus Depan Brebes 02.165 / Gugus Depan Brebes 02.166",
    ),
    getCmsText("landing", "brand", "dewan", "Dewan Ambalan"),
    getCmsText(
      "landing",
      "brand",
      "school_nav",
      "SMK Al Furqon Bantarkawung",
    ),
  ]);

  const displayPrograms =
    featuredRows.length > 0
      ? featuredRows.map((row, i) => ({
          id: row.id,
          icon: PROGRAM_ICONS[i % PROGRAM_ICONS.length],
          judul: row.title,
          desc: row.description ?? "",
          tag: "Program",
        }))
      : DEFAULT_LANDING_PROGRAMS;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-black border-b border-border shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-primary overflow-hidden flex items-center justify-center">
              <LogoImage size={32} />
            </div>
            <div className="hidden sm:block">
              <p className="text-primary text-[10px] sm:text-[11px] font-semibold tracking-wide leading-none">
                {brandEyebrow}
              </p>
              <p className="text-white/60 text-[11px] sm:text-xs leading-tight mt-0.5">
                {brandDewan}
              </p>
              <p className="text-white text-sm font-bold leading-tight">{brandSchoolNav}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70 font-medium">
            <a href="#tentang" className="hover:text-white transition-colors">
              Tentang
            </a>
            <a href="#program" className="hover:text-white transition-colors">
              Program
            </a>
            <a href="#kontak" className="hover:text-white transition-colors">
              Kontak
            </a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="px-2 sm:px-4 py-1.5 rounded-full border border-white/20 text-white/70 hover:border-primary hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Masuk
            </Link>
            {registrationEnabled ? (
              <Link
                href="/register"
                className="px-2 sm:px-4 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                Buat Akun
              </Link>
            ) : (
              <span className="px-2 sm:px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-xs sm:text-sm font-semibold">
                Registrasi Ditutup
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-black text-white min-h-[60vh] sm:min-h-[70vh] md:min-h-[78vh] px-3 sm:px-4 py-12 sm:py-16 md:py-24 flex items-center">
        <div
          className="absolute -right-16 sm:-right-8 md:right-[-2rem] top-1/2 h-64 sm:h-80 md:h-[42rem] w-64 sm:w-80 md:w-[42rem] -translate-y-1/2 opacity-10 sm:opacity-15 md:opacity-20 bg-contain bg-no-repeat bg-center"
          style={{ backgroundImage: 'url(/logo.png)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(6,78,59,0.88),rgba(120,53,15,0.58))]" />

        <div className="relative max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/40 text-white/80 text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-4 tracking-wide">
            <Shield size={12} />
            <span className="line-clamp-1">{brandEyebrow}</span>
          </div>

          <p className="text-white/70 text-sm sm:text-base md:text-lg font-medium tracking-tight mb-3 sm:mb-4 max-w-3xl">
            {brandDewan}
          </p>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight max-w-3xl text-white">
            {heroTitle}
          </h1>

          <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mb-6 sm:mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            {registrationEnabled ? (
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-primary/50"
              >
                Buat Akun Portal
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white/10 text-white/50 font-bold text-xs sm:text-sm">
                Registrasi Ditutup
              </span>
            )}
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full border-2 border-white/30 text-white/70 hover:border-white hover:text-white font-bold text-xs sm:text-sm transition-colors"
            >
              Sudah Anggota? Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-card border-b border-border py-8 sm:py-10 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ angka, label, icon: Icon }) => (
            <div key={label} className="text-center py-3 sm:py-4">
              <Icon
                size={20}
                className="mx-auto mb-1.5 sm:mb-2 text-primary"
              />
              <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary">
                {angka}
              </p>
              <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tentang ── */}
      <section
        id="tentang"
        className="py-12 sm:py-16 px-3 sm:px-4 bg-background"
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-start md:items-center">
          <div>
            <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-2">
              Tentang Kami
            </p>
            <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold mb-4 text-foreground">
              {tentangTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm">
              {tentangP1}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-5 sm:mb-6 text-sm">
              {tentangP2}
            </p>
            <ul className="flex flex-col gap-2 sm:gap-2.5">
              {[
                "Kwartir Ranting Bantarkawung",
                "Kwartir Cabang Brebes, Kwartir Daerah Jawa Tengah",
                "Di bawah naungan SMK Al Furqon Bantarkawung",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs sm:text-sm text-foreground"
                >
                  <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight
                      size={10}
                      className="text-primary"
                    />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3">
            {tentangFeatures.length > 0
              ? tentangFeatures.map(({ icon: Icon, judul, desc, color, bg, iconBg }, i) => (
                  <div key={judul + i} className={`rounded-xl p-4 border ${bg}`}>
                    <div
                      className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-3`}
                    >
                      <Icon size={20} className={color} />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      {judul}
                    </h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))
              : null}
          </div>
        </div>
      </section>

      {/* ── Program Unggulan ── */}
      <section id="program" className="py-12 sm:py-16 px-3 sm:px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-2">
              Program Ambalan
            </p>
            <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-foreground">
              Program Dewan Ambalan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto mt-2 sm:mt-3 leading-relaxed">
              {programLead}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {displayPrograms.map(({ icon: Icon, judul, desc, tag, id }) => (
              <div
                key={id}
                className="rounded-2xl border border-border bg-background p-4 sm:p-6 hover:shadow-lg hover:shadow-primary/10 transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <Icon
                    size={22}
                    className="text-primary"
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-foreground text-xs sm:text-sm">
                    {judul}
                  </h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    {tag}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tri Satya ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-black via-primary/20 to-black text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-6 text-white">
            Tri Satya Pramuka
          </h2>
          <blockquote className="bg-black/70 border border-primary/50 rounded-2xl p-6 md:p-8 text-white/80 leading-loose text-sm md:text-base italic">
            Demi kehormatanku aku berjanji akan bersungguh-sungguh:{" "}
            <strong className="text-white not-italic">
              Menjalankan kewajibanku terhadap Tuhan, Negara Kesatuan Republik
              Indonesia, dan mengamalkan Pancasila;
            </strong>{" "}
            Menolong sesama hidup dan mempersiapkan diri membangun masyarakat;
            Menepati Dasa Dharma.
          </blockquote>
        </div>
      </section>

      {/* ── Postingan Terbaru ── */}
      {recentPosts.length > 0 && (
        <section className="py-16 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
              <div>
                <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-1">
                  Dari Lapangan
                </p>
                <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-foreground">
                  Postingan Terbaru
                </h2>
              </div>
              <Link
                href="/berita"
                className="flex items-center gap-1 text-xs sm:text-sm text-primary font-semibold hover:underline flex-shrink-0"
              >
                Lihat semua <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {recentPosts.map((p) => {
                const cat = categoryConfig[p.category];
                return (
                  <Link
                    key={p.id}
                    href={`/berita/${p.slug}`}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-shadow"
                  >
                    {p.cover_image_url ? (
                      <div className="w-full h-40 sm:h-44 bg-muted overflow-hidden">
                        <img
                          src={getDisplayUrl(p.cover_image_url)}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 sm:h-44 bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                        <span className="text-primary/40 text-4xl font-black opacity-40">
                          {p.title[0]}
                        </span>
                      </div>
                    )}
                    <div className="p-3 sm:p-4">
                      {cat && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cat.cls}`}
                        >
                          {cat.label}
                        </span>
                      )}
                      <h3 className="font-bold text-foreground text-xs sm:text-sm mt-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {formatTanggal(p.published_at ?? p.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section
        id="kontak"
        className="py-12 sm:py-16 px-3 sm:px-4 bg-card"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">{ctaTitle}</h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm md:text-base leading-relaxed px-2">
            Daftarkan dirimu dan jadilah bagian dari keluarga besar Dewan Ambalan
            Pramuka Penegak SMK Al Furqon Bantarkawung masa bakti 2026-2027. Portal
            ini untuk anggota penegak, calon pengurus, dan masyarakat — pendaftaran
            akun, dokumentasi kegiatan, administrasi, serta komentar pada berita.
          </p>
          {registrationEnabled ? (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-10 py-2.5 sm:py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-colors shadow-lg text-xs sm:text-base"
            >
              Buat akun portal pramuka
              <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>
          ) : (
            <p className="inline-flex items-center gap-2 px-6 sm:px-10 py-2.5 sm:py-4 bg-muted text-muted-foreground font-bold rounded-full text-xs sm:text-base">
              Pendaftaran Akun Sedang Ditutup
            </p>
          )}
          <p className="mt-3 sm:mt-4 text-muted-foreground text-xs sm:text-sm">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Contact info strip */}
        <div className="max-w-3xl mx-auto mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-2">
          {[
            { icon: MapPin, text: contact.addressLine },
            { icon: Mail, text: contact.email },
            { icon: Globe, text: contact.websiteLabel },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-muted-foreground break-words min-w-0"
            >
              <Icon
                size={16}
                className="text-primary flex-shrink-0"
              />
              <span className="min-w-0">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black text-white py-6 px-4 text-center border-t border-border">
        <div className="flex flex-col items-center gap-1 mb-2">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary overflow-hidden flex items-center justify-center">
              <LogoImage size={24} />
            </div>
          </div>
          <p className="text-primary/80 text-xs font-semibold tracking-wide">
            {brandEyebrow}
          </p>
          <p className="font-bold text-sm">{brandDewan}</p>
          <p className="text-primary/60 text-sm font-bold">{brandSchoolNav}</p>
          <p className="text-muted-foreground text-[11px]">Kwartir Ranting Bantarkawung</p>
        </div>
        <p className="text-muted-foreground text-xs mt-2">
          &copy; {new Date().getFullYear()} {brandSchoolNav}. Semua hak dilindungi.
        </p>
      </footer>
    </div>
  );
}
