import React from 'react';
import { kegiatanList, anggotaList } from '@/lib/data';

export default function HomePage() {
  // Statistik sesuai koreksi user
  const stats = [
    { label: 'Anggota Aktif', value: '500+' },
    { label: 'Kegiatan / Tahun', value: '10+' },
    { label: 'Masa Bakti', value: '2026/2027' },
    { label: 'Gugus Depan', value: '02.165 - 02.166' }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header / Hero Section */}
      <section className="bg-emerald-800 text-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Dewan Ambalan SMK Al Furqon Bantarkawung</h1>
        <p className="text-emerald-100 max-w-2xl">
          Berkomitmen membina anggota menjadi pribadi beriman, cakap, kreatif, mandiri, dan bertanggung jawab 
          melalui kegiatan kepramukaan yang bermakna di Kwartir Ranting Bantarkawung.
        </p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
            <div className="text-2xl font-bold text-emerald-700">{stat.value}</div>
            <div className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Narasi Perbaikan Lomba & Kemah */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Fokus Kegiatan</h2>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
            <h3 className="font-bold text-amber-900">Perkemahan & Penjelajahan</h3>
            <p className="text-sm text-amber-800">
              Melatih ketangguhan, kemandirian, dan kecintaan terhadap alam melalui kegiatan perkemahan 
              dan penjelajahan di wilayah Brebes dan sekitarnya.
            </p>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900">Pengembangan Kompetensi</h3>
            <p className="text-sm text-blue-800">
              Aktif menyelenggarakan lomba internal Gugus Depan dan mempersiapkan anggota untuk 
              mengikuti LCTP tingkat Penggalang.
            </p>
          </div>
        </section>

        {/* Preview Kegiatan Terbaru */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Kegiatan Terdekat</h2>
          <div className="space-y-3">
            {kegiatanList && kegiatanList.filter(k => k.status === "Akan Datang").slice(0, 3).map((keg) => (
              <div key={keg.id} className="flex justify-between items-center p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div>
                  <div className="font-medium text-slate-900">{keg.nama}</div>
                  <div className="text-xs text-slate-500">{keg.tanggal} • {keg.lokasi}</div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                  {keg.kategori}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white p-8 rounded-2xl text-center">
        <h2 className="text-2xl font-bold mb-4">Siap Bergabung?</h2>
        <p className="text-slate-400 mb-6">
          Daftarkan dirimu dan jadilah bagian dari keluarga besar Dewan Ambalan SMK Al Furqon Bantarkawung 
          masa bakti 2026-2027. Terbuka untuk seluruh siswa-siswi SMK Al Furqon.
        </p>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition">
          Daftar Calon Dewan
        </button>
      </section>
    </div>
  );
}