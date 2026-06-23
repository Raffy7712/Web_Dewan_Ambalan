import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-session";
import { getMyAmbalanApplication } from "@/lib/admin-queries";
import ApplicationForm from "./ApplicationForm";
import {
  CalendarDays,
  CheckCircle,
  ClipboardList,
  ShieldCheck,
  Users,
  ArrowLeft,
  LogIn,
} from "lucide-react";
import { getCmsText, getMasaBakti, isAmbalanRegistrationEnabled } from "@/lib/cms";

export default async function DaftarCalonDewanAmbalanPage() {
  const user = await getCurrentUser();

  const [
    registrationOpen,
    masa,
    heroTitle,
    heroSubtitle,
    syaratBody,
    t1a,
    t1b,
    t2a,
    t2b,
    t3a,
    t3b,
  ] = await Promise.all([
    isAmbalanRegistrationEnabled(),
    getMasaBakti(),
    getCmsText(
      "daftar_ambalan",
      "hero",
      "title",
      "Pendaftaran calon pengurus ambalan",
    ),
    getCmsText(
      "daftar_ambalan",
      "hero",
      "subtitle",
      "Ruang untuk siswa yang aktif di kegiatan pramuka dan siap membantu merencanakan program, latihan, serta kegiatan lapangan bersama Dewan Ambalan SMK Al Furqon.",
    ),
    getCmsText(
      "daftar_ambalan",
      "syarat",
      "body",
      "Aktif mengikuti kegiatan pramuka.\nSiap menjaga nama baik ambalan dan sekolah.\nBersedia hadir dalam rapat, latihan, dan kegiatan lapangan.",
    ),
    getCmsText("daftar_ambalan", "timeline", "step1_label", "Pendaftaran"),
    getCmsText("daftar_ambalan", "timeline", "step1_desc", "Isi data dan motivasi"),
    getCmsText("daftar_ambalan", "timeline", "step2_label", "Seleksi"),
    getCmsText(
      "daftar_ambalan",
      "timeline",
      "step2_desc",
      "Wawancara dan penilaian komitmen",
    ),
    getCmsText("daftar_ambalan", "timeline", "step3_label", "Pelantikan"),
    getCmsText(
      "daftar_ambalan",
      "timeline",
      "step3_desc",
      "Penetapan masa bakti",
    ),
  ]);

  const application = user
    ? await getMyAmbalanApplication(user.id, masa.period_key)
    : null;

  const step3DescFinal =
    /\d{4}/.test(t3b) || t3b.includes(masa.display)
      ? t3b
      : `${t3b} ${masa.display}`.trim();

  const timelineFromCms = [
    { label: t1a, desc: t1b, icon: ClipboardList },
    { label: t2a, desc: t2b, icon: Users },
    { label: t3a, desc: step3DescFinal, icon: ShieldCheck },
  ];

  const syaratItems = syaratBody
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/home"
        className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline mb-6"
      >
        <ArrowLeft size={16} />
        Kembali ke beranda portal
      </Link>

      <section className="rounded-xl overflow-hidden bg-gradient-to-br from-primary/80 via-card to-accent/80 text-white p-6 md:p-8 mb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200 mb-4">
            <CalendarDays size={14} />
            Masa bakti {masa.display}
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
            {heroTitle}
          </h1>
          <p className="mt-3 text-sm md:text-base text-emerald-50/80 leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!registrationOpen ? (
            <div className="bg-white dark:bg-[#150f2d] border border-amber-200 dark:border-amber-900/40 rounded-xl p-6 text-center">
              <p className="text-gray-700 dark:text-purple-200 font-medium mb-2">
                Pendaftaran seleksi sedang ditutup
              </p>
              <p className="text-sm text-gray-500 dark:text-purple-400 mb-4">
                Admin menonaktifkan form untuk sementara. Silakan cek berita
                pengumuman atau hubungi humas ambalan.
              </p>
              <Link
                href="/berita"
                className="inline-flex text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Lihat berita & pengumuman
              </Link>
            </div>
          ) : (
            <ApplicationForm user={user ?? null} application={application} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white dark:bg-[#150f2d] border border-emerald-100 dark:border-purple-900/40 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 dark:text-purple-50 mb-3">
              Alur seleksi
            </h2>
            <div className="space-y-3">
              {timelineFromCms.map(({ label, desc, icon: Icon }, index) => (
                <div key={label} className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-purple-100">
                      {index + 1}. {label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-purple-400">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle
                size={17}
                className="text-amber-700 dark:text-amber-300"
              />
              <h2 className="font-bold text-amber-900 dark:text-amber-200">
                Syarat utama
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
              {syaratItems.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
