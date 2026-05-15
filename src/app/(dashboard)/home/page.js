import Link from "next/link";
import { TrendingUp, Zap, Users, Calendar } from "lucide-react";
import {
  getCmsText,
  getMasaBakti,
  isAmbalanRegistrationEnabled,
} from "@/lib/cms";
import {
  getFeaturedProgramsForPublic,
  getUpcomingKegiatan,
} from "@/lib/queries";

const DEFAULT_FOCUS = [
  {
    id: "_f1",
    title: "Perkemahan & Penjelajahan",
    description:
      "Melatih ketangguhan, kemandirian, dan kecintaan terhadap alam melalui kegiatan lapangan di wilayah Brebes dan sekitarnya.",
  },
  {
    id: "_f2",
    title: "Pengembangan kompetensi",
    description:
      "Lomba internal gugus depan dan persiapan LCTP tingkat Penggalang.",
  },
];

function formatEventDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function HomePage() {
  const [
    heroDescription,
    ctaDescription,
    statMembers,
    statKegiatan,
    masaBakti,
    programs,
    upcomingDb,
    ambalanOpen,
    heroEyebrow,
    heroTitle,
    heroSchoolLine,
    sectionFocusTitle,
    sectionUpcomingTitle,
    statLabelMembers,
    statLabelKegiatan,
    statLabelMasaBakti,
    statLabelGudep,
    statValueGudep,
    ctaBlockTitle,
    ctaButtonLabel,
    ctaClosedMessage,
  ] = await Promise.all([
    getCmsText(
      "home",
      "hero",
      "description",
      "Berkomitmen membina anggota menjadi pribadi beriman, cakap, kreatif, mandiri, dan bertanggung jawab melalui kegiatan kepramukaan yang bermakna.",
    ),
    getCmsText(
      "home",
      "cta",
      "description",
      "Pendaftaran seleksi calon pengurus ambalan dibuka untuk siswa yang aktif di kegiatan pramuka. Terbuka untuk seluruh siswa-siswi SMK Al Furqon.",
    ),
    getCmsText("home", "stats", "members", "500+"),
    getCmsText("home", "stats", "kegiatan", "10+"),
    getMasaBakti(),
    getFeaturedProgramsForPublic(8),
    getUpcomingKegiatan(6),
    isAmbalanRegistrationEnabled(),
    getCmsText("home", "hero", "eyebrow", "Gugus Depan Brebes 02.165 / Gugus Depan Brebes 02.166"),
    getCmsText(
      "home",
      "hero",
      "title",
      "Dewan Ambalan",
    ),
    getCmsText("home", "hero", "school_line", "SMK Al Furqon Bantarkawung"),
    getCmsText("home", "sections", "focus_title", "Fokus kegiatan"),
    getCmsText("home", "sections", "upcoming_title", "Kegiatan terdekat"),
    getCmsText("home", "stats", "label_members", "Anggota aktif"),
    getCmsText("home", "stats", "label_kegiatan", "Kegiatan / tahun"),
    getCmsText("home", "stats", "label_masa_bakti", "Masa bakti"),
    getCmsText("home", "stats", "label_gudep", "Gugus depan"),
    getCmsText("home", "stats", "value_gudep", "02.165 / 02.166"),
    getCmsText("home", "cta", "block_title", "Siap bergabung?"),
    getCmsText(
      "home",
      "cta",
      "button_label",
      "Ikut seleksi calon pengurus dan dewan",
    ),
    getCmsText(
      "home",
      "cta",
      "closed_message",
      "Form seleksi calon pengurus sedang ditutup. Pantau pengumuman di berita atau hubungi pembina pramuka.",
    ),
  ]);

  const focusItems = programs.length > 0 ? programs : DEFAULT_FOCUS;

  const upcomingRows = upcomingDb.slice(0, 3).map((k) => ({
    key: k.id,
    title: k.title,
    tanggal: formatEventDate(k.event_date),
    lokasi: k.event_location ?? "—",
    kategori: k.category ?? "Kegiatan",
    href: k.slug ? `/berita/${k.slug}` : "/kegiatan",
  }));

  const stats = [
    { label: statLabelMembers, value: statMembers, icon: Users },
    { label: statLabelKegiatan, value: statKegiatan, icon: Calendar },
    { label: statLabelMasaBakti, value: masaBakti.display, icon: TrendingUp },
    { label: statLabelGudep, value: statValueGudep, icon: Zap },
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-app)] text-[var(--text-primary)]">
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-emerald-200 text-xs font-semibold tracking-wide mb-1 sm:mb-2">
            {heroEyebrow}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{heroTitle}</h1>
          <p className="text-base sm:text-lg font-bold text-emerald-50 mb-2 sm:mb-3">{heroSchoolLine}</p>
          <p className="text-emerald-100 max-w-2xl text-base sm:text-lg">{heroDescription}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-[var(--surface-elevated)] p-3 sm:p-5 rounded-lg shadow-sm border border-[var(--border-primary)] text-center hover:shadow-md transition-all"
              >
                <div className="flex justify-center mb-1.5 sm:mb-2">
                  <Icon
                    className="text-emerald-600 dark:text-emerald-400"
                    size={20}
                  />
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-0.5 sm:mt-1 line-clamp-2">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {sectionFocusTitle}
            </h2>
            {focusItems.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--surface-elevated)] p-3 sm:p-5 rounded-lg border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="font-bold text-[var(--text-primary)] mb-1.5 sm:mb-2 text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {sectionUpcomingTitle}
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {upcomingRows.length > 0 ? (
                upcomingRows.map((keg) => (
                  <Link
                    key={keg.key}
                    href={keg.href}
                    className="block bg-[var(--surface-elevated)] p-3 sm:p-4 rounded-lg border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">
                          {keg.title}
                        </div>
                        <div className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5 sm:mt-1 truncate">
                          {keg.tanggal} · {keg.lokasi}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 whitespace-nowrap flex-shrink-0">
                        {keg.kategori}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-dashed border-[var(--border-primary)] text-center text-[var(--text-secondary)]">
                  <p className="text-xs sm:text-sm">
                    Tidak ada kegiatan terdekat untuk saat ini.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {ambalanOpen && (
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white p-4 sm:p-8 rounded-lg text-center shadow-lg border border-slate-700 dark:border-slate-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">{ctaBlockTitle}</h2>
            <p className="text-slate-300 mb-4 sm:mb-6 max-w-2xl mx-auto text-xs sm:text-base">{ctaDescription}</p>
            <Link
              href="/daftar-ambalan"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-8 py-2 sm:py-3 rounded-lg font-bold transition-colors shadow-lg text-xs sm:text-base"
            >
              {ctaButtonLabel}
            </Link>
          </section>
        )}

        {!ambalanOpen && (
          <section className="border border-[var(--border-primary)] rounded-lg p-4 sm:p-6 text-center bg-[var(--surface-elevated)] text-[var(--text-secondary)] text-xs sm:text-sm">
            {ctaClosedMessage}
          </section>
        )}
      </div>
    </main>
  );
}
