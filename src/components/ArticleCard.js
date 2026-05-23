import Link from "next/link";
import { Calendar, User, Eye, Share2 } from "lucide-react";

export default function ArticleCard({ 
  slug, 
  judul, 
  ringkasan, 
  kategori, 
  tanggal, 
  penulis, 
  foto,
  views = 0
}) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const categoryColors = {
    Kegiatan: "bg-primary/10 text-primary",
    Kemah: "bg-accent/10 text-accent",
    Prestasi: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    Sosial: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Latihan: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    default: "bg-muted text-muted-foreground",
  };

  const bgClass = categoryColors[kategori] || categoryColors.default;

  return (
    <article className="group bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link href={`/berita/${slug}`} className="relative overflow-hidden aspect-video bg-muted">
        <img
          src={foto}
          alt={judul}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bgClass}`}>
            {kategori}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <Link href={`/berita/${slug}`}>
          <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {judul}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {ringkasan}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(tanggal)}
            </span>
            <span className="flex items-center gap-1">
              <User size={14} />
              {penulis}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {views}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Link
            href={`/berita/${slug}`}
            className="flex-1 text-center px-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Baca Selengkapnya
          </Link>
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted">
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}