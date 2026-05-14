import Link from "next/link";
import { getCmsText } from "@/lib/cms";
import { getUpcomingKegiatan, getPastKegiatan } from "@/lib/queries";
import {
  CalendarDays,
  MapPin,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

function formatTanggalPanjang(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTanggal(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CalendarBadge({ iso }) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg px-3 py-2 text-center min-w-14 flex-shrink-0 shadow-lg">
      <p className="text-2xl font-extrabold leading-none">{d.getDate()}</p>
      <p className="text-xs opacity-90 mt-0.5">
        {d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}
      </p>
    </div>
  );
}

export default async function KegiatanPage() {
  const [
    upcoming,
    past,
    heroTitle,
    heroSubtitle,
    upcomingSectionTitle,
    upcomingCountSuffix,
    upcomingEmpty,
    pastSectionTitle,
    pastCountSuffix,
  ] = await Promise.all([
    getUpcomingKegiatan(8),
    getPastKegiatan(8),
    getCmsText("kegiatan", "hero", "title", "Jadwal Kegiatan"),
    getCmsText(
      "kegiatan",
      "hero",
      "subtitle",
      "Program dan kegiatan Dewan Ambalan SMK Al Furqon",
    ),
    getCmsText("kegiatan", "upcoming", "section_title", "Kegiatan Mendatang"),
    getCmsText("kegiatan", "upcoming", "count_suffix", "kegiatan yang akan datang"),
    getCmsText(
      "kegiatan",
      "upcoming",
      "empty",
      "Tidak ada kegiatan mendatang saat ini.",
    ),
    getCmsText("kegiatan", "past", "section_title", "Kegiatan Selesai"),
    getCmsText("kegiatan", "past", "count_suffix", "kegiatan yang telah berlangsung"),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {heroTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{heroSubtitle}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Upcoming Kegiatan */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {upcomingSectionTitle}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {upcoming.length} {upcomingCountSuffix}
              </p>
            </div>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
              <CalendarDays size={40} className="mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">{upcomingEmpty}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcoming.map((k) => (
                <Link
                  key={k.id}
                  href={`/berita/${k.slug}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex gap-4 items-start hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                >
                  <CalendarBadge iso={k.event_date} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {k.title}
                    </h3>
                    {k.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {k.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <CalendarDays size={16} className="text-emerald-600" />
                        {formatTanggalPanjang(k.event_date)}
                      </span>
                      {k.event_location && (
                        <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin size={16} className="text-emerald-600" />
                          {k.event_location}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-slate-400 group-hover:text-emerald-600 flex-shrink-0 mt-1 transition-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Past Kegiatan */}
        {past.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {pastSectionTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {past.length} {pastCountSuffix}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              {past.map((k) => (
                <Link
                  key={k.id}
                  href={`/berita/${k.slug}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex gap-3 items-start hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg px-3 py-2 text-center min-w-12 flex-shrink-0">
                    <p className="text-lg font-bold leading-none">
                      {new Date(k.event_date).getDate()}
                    </p>
                    <p className="text-xs mt-0.5">
                      {new Date(k.event_date).toLocaleDateString("id-ID", {
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {k.title}
                      </h3>
                      <CheckCircle2
                        size={16}
                        className="text-slate-400 flex-shrink-0"
                      />
                    </div>
                    {k.event_location && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin size={14} /> {k.event_location}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
