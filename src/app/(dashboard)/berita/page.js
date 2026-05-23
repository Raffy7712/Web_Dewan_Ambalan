import Link from "next/link";
import { getCmsText } from "@/lib/cms";
import { getPosts } from "@/lib/queries";
import { getDisplayUrl } from "@/lib/media-url";
import { Newspaper, ChevronRight } from "lucide-react";

function formatTanggal(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_CLS = {
  pengumuman: "bg-primary/10 text-primary",
  kegiatan: "bg-accent/10 text-accent",
  prestasi:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  galeri: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
};

export default async function BeritaPage({ searchParams }) {
  const { kategori } = await searchParams;
  const aktif = ["pengumuman", "kegiatan", "prestasi", "galeri"].includes(
    kategori,
  )
    ? kategori
    : null;

  const [
    posts,
    heroTitle,
    heroSubtitle,
    tabSemua,
    tabPengumuman,
    tabKegiatan,
    tabPrestasi,
    tabGaleri,
    emptyNoPosts,
    emptyViewAll,
    otherPostsTitle,
    readMoreLabel,
  ] = await Promise.all([
    getPosts({
      category: aktif,
      excludeCategory: aktif ? null : "galeri",
      limit: 12,
    }),
    getCmsText("berita", "hero", "title", "Berita & Artikel"),
    getCmsText(
      "berita",
      "hero",
      "subtitle",
      "Baca artikel terbaru tentang kegiatan dan prestasi Dewan Ambalan",
    ),
    getCmsText("berita", "tabs", "semua", "Semua"),
    getCmsText("berita", "tabs", "pengumuman", "Pengumuman"),
    getCmsText("berita", "tabs", "kegiatan", "Kegiatan"),
    getCmsText("berita", "tabs", "prestasi", "Prestasi"),
    getCmsText("berita", "tabs", "galeri", "Album"),
    getCmsText(
      "berita",
      "empty",
      "no_posts",
      "Belum ada post untuk kategori ini.",
    ),
    getCmsText("berita", "empty", "view_all", "Lihat semua post"),
    getCmsText("berita", "list", "other_posts_title", "Post Lainnya"),
    getCmsText("berita", "card", "read_more", "Baca selengkapnya"),
  ]);

  const [featured, ...rest] = posts;

  const tabNav = [
    { key: null, label: tabSemua },
    { key: "pengumuman", label: tabPengumuman },
    { key: "kegiatan", label: tabKegiatan },
    { key: "prestasi", label: tabPrestasi },
    { key: "galeri", label: tabGaleri },
  ];

  const categoryLabel = (cat) => {
    const map = {
      pengumuman: tabPengumuman,
      kegiatan: tabKegiatan,
      prestasi: tabPrestasi,
      galeri: tabGaleri,
    };
    return map[cat] ?? cat;
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-card border-b border-border py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {heroTitle}
          </h1>
          <p className="text-muted-foreground">{heroSubtitle}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabNav.map(({ key, label }) => {
            const isActive = aktif === key;
            return (
              <Link
                key={label}
                href={key ? `/berita?kategori=${key}` : "/berita"}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground border border-border hover:border-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <Newspaper size={48} className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">
              {emptyNoPosts}
            </p>
            <Link
              href="/berita"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              {emptyViewAll}
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && (
              <Link
                href={`/berita/${featured.slug}`}
                className="group block mb-8"
              >
                <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all">
                  {featured.cover_image_url ? (
                    <div className="relative w-full h-56 md:h-80 bg-muted">
                      <img
                        src={getDisplayUrl(featured.cover_image_url)}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        {(() => {
                          const cls =
                            CATEGORY_CLS[featured.category] ??
                            "bg-muted text-foreground";
                          return (
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold inline-block mb-3 ${cls}`}
                            >
                              {categoryLabel(featured.category)}
                            </span>
                          );
                        })()}
                        <h2 className="text-white text-2xl md:text-3xl font-bold leading-snug mb-2">
                          {featured.title}
                        </h2>
                        <p className="text-white/80 text-sm">
                          {formatTanggal(
                            featured.published_at ?? featured.created_at,
                          )}{" "}
                          · {featured.author?.display_name ?? "Anonim"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-b border-border">
                      {(() => {
                        const cls =
                            CATEGORY_CLS[featured.category] ??
                            "bg-muted text-muted-foreground";
                          return (
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold inline-block mb-3 ${cls}`}
                            >
                              {categoryLabel(featured.category)}
                            </span>
                          );
                        })()}
                        <h2 className="text-foreground text-2xl font-bold mb-2">
                        {featured.title}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {formatTanggal(
                          featured.published_at ?? featured.created_at,
                        )}{" "}
                        · {featured.author?.display_name ?? "Anonim"}
                      </p>
                    </div>
                  )}
                  {featured.description && (
                    <div className="p-6">
                      <p className="text-foreground line-clamp-2 mb-3">
                        {featured.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                        {readMoreLabel} <ChevronRight size={16} />
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )}

            {/* Articles Grid */}
            {rest.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-foreground mb-6 mt-10">
                  {otherPostsTitle}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((p) => {
                    const cls =
                      CATEGORY_CLS[p.category] ??
                      "bg-muted text-foreground";
                    return (
                      <Link
                        key={p.id}
                        href={`/berita/${p.slug}`}
                        className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
                      >
                        {p.cover_image_url && (
                          <div className="w-full h-40 bg-muted overflow-hidden">
                            <img
                              src={getDisplayUrl(p.cover_image_url)}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block mb-2 ${cls}`}
                          >
                            {categoryLabel(p.category)}
                          </span>
                          <h3 className="font-bold text-foreground text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {p.title}
                          </h3>
                          {p.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {p.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatTanggal(p.published_at ?? p.created_at)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
