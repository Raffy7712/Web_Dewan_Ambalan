import { getGallery } from "@/lib/queries";
import { getCmsText } from "@/lib/cms";
import GaleriView from "./GaleriView";

export default async function GaleriPage() {
  const [media, heroTitle, heroSubtitle] = await Promise.all([
    getGallery(),
    getCmsText("galeri", "hero", "title", "Galeri Foto"),
    getCmsText(
      "galeri",
      "hero",
      "subtitle",
      "Dokumentasi kegiatan dan momen berharga Dewan Ambalan SMK Al Furqon",
    ),
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

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <GaleriView initialMedia={media} />
      </div>
    </main>
  );
}
