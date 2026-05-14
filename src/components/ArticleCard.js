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
    Kegiatan: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Kemah: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Prestasi: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    Sosial: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Latihan: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const bgClass = categoryColors[kategori] || categoryColors.default;

  return (
    <article className="group bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link href={`/berita/${slug}`} className="relative overflow-hidden aspect-video bg-slate-200 dark:bg-slate-800">
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
            {judul}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
          {ringkasan}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 flex-wrap gap-2">
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
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={`/berita/${slug}`}
            className="flex-1 text-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Baca Selengkapnya
          </Link>
          <button className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
