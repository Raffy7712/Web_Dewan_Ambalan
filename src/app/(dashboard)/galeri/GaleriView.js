"use client";
import { useState } from "react";
import Link from "next/link";
import { getDisplayUrl } from "@/lib/media-url";
import { ImageIcon, X, ChevronRight } from "lucide-react";

const categoryConfig = {
  semua: "Semua",
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  prestasi: "Prestasi",
};

export default function GaleriView({ initialMedia = [] }) {
  const [filter, setFilter] = useState("semua");
  const [lightbox, setLightbox] = useState(null);

  const filtered = filter === "semua" 
    ? initialMedia 
    : initialMedia.filter((m) => m.post?.category === filter);

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.entries(categoryConfig).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <ImageIcon size={48} className="mx-auto mb-3 text-slate-400" />
          <p className="font-medium text-slate-600 dark:text-slate-400">Belum ada foto untuk kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => setLightbox(m)}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-slate-200 dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all"
            >
              <img
                src={getDisplayUrl(m.url)}
                alt={m.caption ?? "Foto dokumentasi"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {m.caption && (
                  <p className="text-white text-xs font-medium leading-tight line-clamp-2">
                    {m.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden max-w-3xl w-full shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-black">
              <img
                src={getDisplayUrl(lightbox.url)}
                alt={lightbox.caption ?? "Foto"}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white hover:bg-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                {lightbox.caption && (
                  <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                    {lightbox.caption}
                  </p>
                )}
                {lightbox.post && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold">
                      {categoryConfig[lightbox.post.category] ?? lightbox.post.category}
                    </span>
                    <Link
                      href={`/berita/${lightbox.post.slug}`}
                      onClick={() => setLightbox(null)}
                      className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                    >
                      Baca Berita Terkait <ChevronRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}