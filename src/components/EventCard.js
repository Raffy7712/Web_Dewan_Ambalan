import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

export default function EventCard({ 
  id, 
  nama, 
  tanggal, 
  waktu, 
  lokasi, 
  kategori,
  deskripsi,
  status = "Akan Datang",
  peserta = 0
}) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusColors = {
    "Akan Datang": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "Sedang Berlangsung": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "Selesai": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const categoryColors = {
    Latihan: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Kemah: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Rapat: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Lomba: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    Sosial: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    Pelantikan: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const statusBg = statusColors[status] || statusColors["Akan Datang"];
  const categoryBg = categoryColors[kategori] || categoryColors.default;

  return (
    <article className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {nama}
            </h3>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${categoryBg}`}>
            {kategori}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
          {deskripsi}
        </p>

        {/* Event details */}
        <div className="space-y-2 mb-4 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{formatDate(tanggal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{waktu}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="line-clamp-1">{lokasi}</span>
          </div>
          {peserta > 0 && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{peserta} peserta</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBg}`}>
            {status}
          </span>
          <Link
            href={`/kegiatan/${id}`}
            className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
          >
            Detail →
          </Link>
        </div>
      </div>
    </article>
  );
}
