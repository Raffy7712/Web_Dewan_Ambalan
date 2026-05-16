import Link from "next/link";
import { getPostBySlug, getPosts, getComments } from "@/lib/queries";
import {
  getDisplayUrl,
  getDriveVideoEmbedUrl,
  isGoogleDriveUrl,
} from "@/lib/media-url";
import { getSession } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import CommentForm from "@/components/CommentForm";
import CommentList from "@/components/CommentList";
import ImageLightbox from "@/components/ImageLightbox";
import {
  ChevronRight,
  User,
  CalendarDays,
  MapPin,
  Trophy,
  MessageSquare,
  ImageIcon,
  Pin,
} from "lucide-react";

// Page needs session for comments, so must be dynamic
export const dynamic = "force-dynamic";

function formatTanggal(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const categoryConfig = {
  pengumuman: {
    label: "Pengumuman",
    cls: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  },
  kegiatan: {
    label: "Kegiatan",
    cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  },
  prestasi: {
    label: "Prestasi",
    cls: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  },
  galeri: {
    label: "Album dokumentasi",
    cls: "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200",
  },
};

const levelLabel = {
  sekolah: "Tingkat Sekolah",
  kecamatan: "Tingkat Kecamatan",
  kabupaten: "Tingkat Kabupaten",
  provinsi: "Tingkat Provinsi",
  nasional: "Tingkat Nasional",
};

export async function generateStaticParams() {
  try {
    const posts = await getPosts({ limit: 50 });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    // DB unavailable at build time — skip static generation
    return [];
  }
}

export default async function PostDetailPage({ params }) {
  const { slug } = await params;
  const [post, recentPosts, session] = await Promise.all([
    getPostBySlug(slug),
    getPosts({ limit: 4, excludeCategory: "galeri" }),
    getSession(),
  ]);

  if (!post) notFound();

  const comments = await getComments(post.id);
  const lainnya = recentPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const images = (post.post_media ?? []).filter(
    (m) => m.media_type === "image",
  );
  const videos = (post.post_media ?? []).filter(
    (m) => m.media_type === "video",
  );
  const cat = categoryConfig[post.category];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-purple-500 mb-5">
        <Link
          href="/home"
          className="hover:text-purple-700 dark:hover:text-purple-300"
        >
          Beranda
        </Link>
        <ChevronRight size={12} />
        <Link
          href="/berita"
          className="hover:text-purple-700 dark:hover:text-purple-300"
        >
          Berita
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-600 dark:text-purple-400 truncate max-w-xs">
          {post.title}
        </span>
      </nav>

      {/* Article */}
      <article className="bg-white dark:bg-[#150f2d] border border-purple-100 dark:border-purple-900/40 rounded-2xl overflow-hidden mb-8 shadow-sm">
        {/* Cover */}
        {post.cover_image_url && (
          <div className="w-full h-56 md:h-80 bg-purple-100 dark:bg-purple-900/20">
            <img
              src={getDisplayUrl(post.cover_image_url)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 md:p-8">
          {/* Category + meta */}
          <div className="flex flex-wrap gap-2 items-center mb-3">
            {cat && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${cat.cls}`}
              >
                {cat.label}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-purple-500 flex items-center gap-1">
              <CalendarDays size={12} />
              {formatTanggal(post.published_at ?? post.created_at)}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-purple-50 leading-snug mb-3">
            {post.title}
          </h1>

          <p className="text-sm text-gray-500 dark:text-purple-400 flex items-center gap-1.5 mb-5">
            <User size={14} />
            <span>
              Ditulis oleh{" "}
              <span className="font-semibold text-gray-700 dark:text-purple-300">
                {post.author?.display_name ?? "Anonim"}
              </span>
            </span>
          </p>

          {/* Kegiatan info */}
          {post.category === "kegiatan" &&
            (post.event_date || post.event_location) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-5 flex flex-wrap gap-4">
                {post.event_date && (
                  <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <CalendarDays size={16} className="flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        Tanggal
                      </p>
                      <p className="font-semibold">
                        {formatTanggal(post.event_date)}
                      </p>
                    </div>
                  </div>
                )}
                {post.event_location && (
                  <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <MapPin size={16} className="flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        Lokasi
                      </p>
                      <p className="font-semibold">{post.event_location}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Prestasi info */}
          {post.category === "prestasi" &&
            (post.achievement_rank || post.achievement_level) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl p-4 mb-5 flex flex-wrap gap-4">
                {post.achievement_rank && (
                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                    <Trophy size={16} className="flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        Peringkat
                      </p>
                      <p className="font-bold">{post.achievement_rank}</p>
                    </div>
                  </div>
                )}
                {post.achievement_level && (
                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                    <Trophy size={16} className="flex-shrink-0 opacity-60" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        Level
                      </p>
                      <p className="font-semibold">
                        {levelLabel[post.achievement_level] ??
                          post.achievement_level}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Content */}
          {post.content && (
            <div className="article-content text-gray-700 dark:text-purple-200 text-sm leading-relaxed whitespace-pre-line border-t border-purple-100 dark:border-purple-900/40 pt-5">
              {post.content}
            </div>
          )}
        </div>
      </article>

      {/* Media Gallery */}
      {images.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon
              size={18}
              className="text-purple-600 dark:text-purple-400"
            />
            <h2 className="text-lg font-bold text-gray-800 dark:text-purple-50">
              Galeri Foto ({images.length})
            </h2>
          </div>
          <ImageLightbox
            images={images.map((img) => getDisplayUrl(img.url))}
          />
        </section>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-purple-50 mb-3">
            Video
          </h2>
          <div className="flex flex-col gap-3">
            {videos.map((v) => {
              const driveEmbed = isGoogleDriveUrl(v.url)
                ? getDriveVideoEmbedUrl(v.url)
                : "";
              return (
                <div
                  key={v.id}
                  className="rounded-xl overflow-hidden bg-black aspect-video"
                >
                  {driveEmbed ? (
                    <iframe
                      title="Video dokumentasi"
                      src={driveEmbed}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={v.url}
                      poster={
                        v.thumbnail_url
                          ? getDisplayUrl(v.thumbnail_url)
                          : undefined
                      }
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare
            size={18}
            className="text-purple-600 dark:text-purple-400"
          />
          <h2 className="text-lg font-bold text-gray-800 dark:text-purple-50">
            Komentar ({comments.length})
          </h2>
        </div>

        {/* Comment form */}
        <div className="mb-5">
          <CommentForm
            postId={post.id}
            postTitle={post.title}
            postSlug={post.slug}
            session={session}
          />
        </div>

        {/* Comment list with admin controls */}
        <CommentList initialComments={comments} session={session} />
      </section>

      {/* Related */}
      {lainnya.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 dark:text-purple-50 mb-4">
            Post Lainnya
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {lainnya.map((p) => {
              const c = categoryConfig[p.category];
              return (
                <Link
                  key={p.id}
                  href={`/berita/${p.slug}`}
                  className="group bg-white dark:bg-[#150f2d] border border-purple-100 dark:border-purple-900/40 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {p.cover_image_url && (
                    <img
                      src={getDisplayUrl(p.cover_image_url)}
                      alt={p.title}
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-3">
                    {c && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.cls}`}
                      >
                        {c.label}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-purple-100 mt-1.5 group-hover:text-purple-700 dark:group-hover:text-purple-300 line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-purple-500 mt-0.5">
                      {formatTanggal(p.published_at ?? p.created_at)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6">
        <Link
          href="/berita"
          className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 font-semibold hover:underline"
        >
          &larr; Kembali ke Berita
        </Link>
      </div>
    </div>
  );
}
