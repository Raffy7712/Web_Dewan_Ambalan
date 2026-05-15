import Link from "next/link";
import LogoImage from "@/components/LogoImage";
import { getRecentPosts, getFeaturedProgramsForPublic } from "@/lib/queries";
import { getCmsText, getCmsEntriesByPage, isRegistrationEnabled } from "@/lib/cms";
import { getDisplayUrl } from "@/lib/media-url";
import { getSiteContact } from "@/lib/site-contact";
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
  Phone,
  Mail,
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
        color: payload.color || "text-amber-600 dark:text-amber-400",
        bg: payload.bg || "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40",
        iconBg: payload.iconBg || "bg-amber-100 dark:bg-amber-900/40",
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
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  kegiatan: {
    label: "Kegiatan",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
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
    getSiteContact(),
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
    <div className="flex flex-col min-h-screen bg-[var(--surface-app)] text-[var(--text-primary)]">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-emerald-600 overflow-hidden flex items-center justify-center">
              <LogoImage size={32} />
            </div>
            <div className="hidden sm:block">
              <p className="text-emerald-300/90 text-[10px] sm:text-[11px] font-semibold tracking-wide leading-none">
                {brandEyebrow}
              </p>
              <p className="text-slate-300 text-[11px] sm:text-xs leading-tight mt-0.5">
                {brandDewan}
              </p>
              <p className="text-white text-sm font-bold leading-tight">{brandSchoolNav}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
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
              className="px-2 sm:px-4 py-1.5 rounded-full border border-slate-600 text-slate-200 hover:border-emerald-500 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Masuk
            </Link>
            {registrationEnabled ? (
              <Link
                href="/register"
                className="px-2 sm:px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                Buat Akun
              </Link>
            ) : (
              <span className="px-2 sm:px-4 py-1.5 rounded-full bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold">
                Registrasi Ditutup
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[60vh] sm:min-h-[70vh] md:min-h-[78vh] px-3 sm:px-4 py-12 sm:py-16 md:py-24 flex items-center">
        <img
          src="/logo.png"
          alt=""
          className="absolute -right-16 sm:-right-8 md:right-[-2rem] top-1/2 h-64 sm:h-80 md:h-[42rem] w-64 sm:w-80 md:w-[42rem] -translate-y-1/2 object-contain opacity-10 sm:opacity-15 md:opacity-20"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(6,78,59,0.88),rgba(120,53,15,0.58))]" />

        <div className="relative max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-4 tracking-wide">
            <Shield size={12} />
            <span className="line-clamp-1">{brandEyebrow}</span>
          </div>

          <p className="text-emerald-100/90 text-sm sm:text-base md:text-lg font-medium tracking-tight mb-3 sm:mb-4 max-w-3xl">
            {brandDewan}
          </p>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight max-w-3xl text-white">
            {heroTitle}
          </h1>

          <p className="text-emerald-50/80 text-sm sm:text-base md:text-lg max-w-2xl mb-6 sm:mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            {registrationEnabled ? (
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-emerald-950/50"
              >
                Buat Akun Portal
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm">
                Registrasi Ditutup
              </span>
            )}
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full border-2 border-emerald-400/80 text-emerald-100 hover:border-white hover:text-white font-bold text-xs sm:text-sm transition-colors"
            >
              Sudah Anggota? Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[var(--surface-elevated)] dark:bg-slate-900 border-b border-[var(--border-primary)] py-8 sm:py-10 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ angka, label, icon: Icon }) => (
            <div key={label} className="text-center py-3 sm:py-4">
              <Icon
                size={20}
                className="mx-auto mb-1.5 sm:mb-2 text-emerald-600 dark:text-emerald-400"
              />
              <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {angka}
              </p>
              <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tentang ── */}
      <section
        id="tentang"
        className="py-12 sm:py-16 px-3 sm:px-4 bg-[var(--surface-app)]"
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-start md:items-center">
          <div>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-2">
              Tentang Kami
            </p>
            <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold mb-4 text-[var(--text-primary)]">
              {tentangTitle}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3 sm:mb-4 text-sm">
              {tentangP1}
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-5 sm:mb-6 text-sm">
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
                  className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text-primary)]"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight
                      size={10}
                      className="text-emerald-600 dark:text-emerald-400"
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
                    <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">
                      {judul}
                    </h4>
                    <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))
              : null}
          </div>
        </div>
      </section>

      {/* ── Program Unggulan ── */}
      <section id="program" className="py-12 sm:py-16 px-3 sm:px-4 bg-[var(--surface-elevated)] dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-2">
              Program Ambalan
            </p>
            <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-[var(--text-primary)]">
              Program Dewan Ambalan
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto mt-2 sm:mt-3 leading-relaxed">
              {programLead}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {displayPrograms.map(({ icon: Icon, judul, desc, tag, id }) => (
              <div
                key={id}
                className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-app)] dark:bg-slate-950 p-4 sm:p-6 hover:shadow-lg hover:shadow-emerald-900/10 dark:hover:shadow-emerald-950/40 transition-shadow"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <Icon
                    size={22}
                    className="text-emerald-700 dark:text-emerald-400"
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">
                    {judul}
                  </h3>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    {tag}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tri Satya ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-4">
            Janji Pramuka
          </p>
          <h2 className="text-xl font-bold mb-6 text-white">
            Tri Satya Pramuka
          </h2>
          <blockquote className="bg-slate-950/70 border border-emerald-800/50 rounded-2xl p-6 md:p-8 text-emerald-100/90 leading-loose text-sm md:text-base italic">
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
        <section className="py-16 px-4 bg-[var(--surface-app)]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-widest mb-1">
                  Dari Lapangan
                </p>
                <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-[var(--text-primary)]">
                  Postingan Terbaru
                </h2>
              </div>
              <Link
                href="/berita"
                className="flex items-center gap-1 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex-shrink-0"
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
                    className="group bg-[var(--surface-elevated)] dark:bg-slate-900 border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-emerald-900/10 dark:hover:shadow-emerald-950/30 transition-shadow"
                  >
                    {p.cover_image_url ? (
                      <div className="w-full h-40 sm:h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={getDisplayUrl(p.cover_image_url)}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 sm:h-44 bg-gradient-to-br from-emerald-100 to-slate-200 dark:from-emerald-900/30 dark:to-slate-800 flex items-center justify-center">
                        <span className="text-emerald-400 dark:text-emerald-800 text-4xl font-black opacity-40">
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
                      <h3 className="font-bold text-[var(--text-primary)] text-xs sm:text-sm mt-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)] mt-2">
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
        className="py-12 sm:py-16 px-3 sm:px-4 bg-[var(--surface-elevated)] dark:bg-slate-900"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-2.5xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">{ctaTitle}</h2>
          <p className="text-[var(--text-secondary)] mb-6 sm:mb-8 text-xs sm:text-sm md:text-base leading-relaxed px-2">
            Daftarkan dirimu dan jadilah bagian dari keluarga besar Dewan Ambalan
            Pramuka Penegak SMK Al Furqon Bantarkawung masa bakti 2026-2027. Portal
            ini untuk anggota penegak, calon pengurus, dan masyarakat — pendaftaran
            akun, dokumentasi kegiatan, administrasi, serta komentar pada berita.
          </p>
          {registrationEnabled ? (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-10 py-2.5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-colors shadow-lg text-xs sm:text-base"
            >
              Buat akun portal pramuka
              <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>
          ) : (
            <p className="inline-flex items-center gap-2 px-6 sm:px-10 py-2.5 sm:py-4 bg-slate-700 text-slate-100 font-bold rounded-full text-xs sm:text-base">
              Pendaftaran Akun Sedang Ditutup
            </p>
          )}
          <p className="mt-3 sm:mt-4 text-[var(--text-muted)] text-xs sm:text-sm">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Contact info strip */}
        <div className="max-w-3xl mx-auto mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-2">
          {[
            { icon: MapPin, text: contact.addressLine },
            { icon: Phone, text: contact.phone },
            { icon: Mail, text: contact.email },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 bg-[var(--surface-app)] dark:bg-slate-950 border border-[var(--border-primary)] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--text-secondary)]"
            >
              <Icon
                size={16}
                className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-white py-6 px-4 text-center border-t border-slate-800">
        <div className="flex flex-col items-center gap-1 mb-2">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-600 overflow-hidden flex items-center justify-center">
              <LogoImage size={24} />
            </div>
          </div>
          <p className="text-emerald-300/90 text-xs font-semibold tracking-wide">
            {brandEyebrow}
          </p>
          <p className="font-bold text-sm">{brandDewan}</p>
          <p className="text-emerald-200 text-sm font-bold">{brandSchoolNav}</p>
          <p className="text-slate-500 text-[11px]">Kwartir Ranting Bantarkawung</p>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          &copy; {new Date().getFullYear()} {brandSchoolNav}. Semua hak dilindungi.
        </p>
      </footer>
    </div>
  );
}
