/**
 * cms-bindings.js — CMS page bindings and constants
 * Extracted from cms.js to avoid non-async exports in "use server" chain
 */

export const CMS_PAGES = [
  { key: "landing", label: "Landing" },
  { key: "home", label: "Dashboard Home" },
  { key: "organization", label: "Profil Organisasi" },
  { key: "footer", label: "Footer & CTA" },
  { key: "daftar_ambalan", label: "Seleksi calon pengurus" },
  { key: "kegiatan", label: "Jadwal kegiatan" },
  { key: "berita", label: "Berita & artikel" },
  { key: "galeri", label: "Galeri" },
  { key: "keuangan", label: "Transparansi keuangan" },
];

/**
 * Slot teks yang dibaca `getCmsText(page_key, section, entry)` di kode. Hanya entri **Published** yang tampil
 * di situs. Isi contoh (`sample`) untuk petunjuk admin — tidak otomatis tersimpan.
 */
export const CMS_PUBLIC_BINDINGS = {
  landing: {
    path: "/",
    pathTitle: "Landing publik",
    pageKey: "landing",
    rows: [
      {
        section: "brand",
        entry: "eyebrow",
        label: "Branding — baris gugus depan (navbar, hero, footer)",
        hint: "Tampil sebagai label kecil / pill; gunakan istilah resmi Gugus Depan.",
        sample:
          "Gugus Depan Brebes 02.165 / Gugus Depan Brebes 02.166",
      },
      {
        section: "brand",
        entry: "dewan",
        label: "Branding — nama dewan (satu baris)",
        hint: "Di bawah baris gugus depan, sebelum judul besar hero.",
        sample: "Dewan Ambalan",
      },
      {
        section: "brand",
        entry: "school_nav",
        label: "Branding — nama sekolah (navbar & footer)",
        hint: "Baris ketiga di logo navbar; footer.",
        sample: "SMK Al Furqon Bantarkawung",
      },
      {
        section: "hero",
        entry: "title",
        label: "Judul hero (nama besar)",
        hint: "Baris judul utama di atas lipatan.",
        sample: "SMK Al Furqon Bantarkawung",
      },
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul hero",
        hint: "Teks pengantar di bawah judul.",
        sample:
          "Satyaku Kudarmakan… — narasi singkat penegak & wilayah Bantarkawung.",
      },
      {
        section: "cta",
        entry: "title",
        label: "Judul blok ajakan (CTA)",
        hint: "Judul ajakan bergabung / aksi.",
        sample: "Siap bergabung dengan kegiatan kami?",
      },
      {
        section: "tentang",
        entry: "title",
        label: "Judul blok Tentang",
        hint: "Judul section tentang di landing.",
        sample: "Pramuka Penegak di Dewan Ambalan",
      },
      {
        section: "tentang",
        entry: "p1",
        label: "Tentang — paragraf 1",
        hint: "Paragraf pertama penjelasan organisasi.",
        sample:
          "Dewan Ambalan Pramuka Penegak SMK Al Furqon… (gugus depan, kwartir).",
      },
      {
        section: "tentang",
        entry: "p2",
        label: "Tentang — paragraf 2",
        hint: "Paragraf kedua (nilai, program).",
        sample: "Kami membina penegak untuk mengamalkan Tri Satya…",
      },
      {
        section: "program",
        entry: "lead",
        label: "Pengantar daftar program",
        hint: "Teks di atas kartu program (sumber data: Program unggulan admin).",
        sample: "Program kerja unggulan masa bakti ini antara lain:",
      },
    ],
  },
  home: {
    path: "/home",
    pathTitle: "Beranda portal anggota",
    pageKey: "home",
    rows: [
      {
        section: "hero",
        entry: "description",
        label: "Deskripsi hero beranda",
        hint: "Teks pembuka setelah login / beranda portal.",
        sample: "Berkomitmen membina anggota menjadi pribadi beriman…",
      },
      {
        section: "cta",
        entry: "description",
        label: "Deskripsi blok CTA seleksi",
        hint: "Teks di blok undangan seleksi calon pengurus.",
        sample: "Pendaftaran seleksi calon pengurus ambalan dibuka untuk…",
      },
      {
        section: "stats",
        entry: "members",
        label: "Statistik — teks anggota",
        hint: "Angka atau label singkat (mis. 500+).",
        sample: "500+",
      },
      {
        section: "stats",
        entry: "kegiatan",
        label: "Statistik — teks kegiatan",
        hint: "Angka atau label singkat (mis. 10+).",
        sample: "10+",
      },
      {
        section: "hero",
        entry: "eyebrow",
        label: "Hero — label gugus depan (baris kecil)",
        hint: "Teks di atas judul beranda (navbar portal memakai string yang sama lewat slot terpisah).",
        sample:
          "Gugus Depan Brebes 02.165 / Gugus Depan Brebes 02.166",
      },
      {
        section: "hero",
        entry: "title",
        label: "Hero — judul utama beranda",
        hint: "Judul besar setelah login.",
        sample: "Dewan Ambalan SMK Al Furqon Bantarkawung",
      },
      {
        section: "hero",
        entry: "school_line",
        label: "Hero — nama sekolah (baris tebal)",
        hint: "Satu baris di bawah judul.",
        sample: "SMK Al Furqon",
      },
      {
        section: "sections",
        entry: "focus_title",
        label: "Judul kolom Fokus kegiatan",
        sample: "Fokus kegiatan",
      },
      {
        section: "sections",
        entry: "upcoming_title",
        label: "Judul kolom Kegiatan terdekat",
        sample: "Kegiatan terdekat",
      },
      {
        section: "stats",
        entry: "label_members",
        label: "Label statistik — anggota aktif",
        sample: "Anggota aktif",
      },
      {
        section: "stats",
        entry: "label_kegiatan",
        label: "Label statistik — kegiatan per tahun",
        sample: "Kegiatan / tahun",
      },
      {
        section: "stats",
        entry: "label_masa_bakti",
        label: "Label statistik — masa bakti",
        sample: "Masa bakti",
      },
      {
        section: "stats",
        entry: "label_gudep",
        label: "Label statistik — gugus depan",
        sample: "Gugus depan",
      },
      {
        section: "stats",
        entry: "value_gudep",
        label: "Nilai teks statistik — nomor gudep",
        sample: "02.165 / 02.166",
      },
      {
        section: "cta",
        entry: "block_title",
        label: "CTA seleksi — judul blok (h2)",
        sample: "Siap bergabung?",
      },
      {
        section: "cta",
        entry: "button_label",
        label: "CTA seleksi — teks tombol",
        sample: "Ikut seleksi calon pengurus dan dewan",
      },
      {
        section: "cta",
        entry: "closed_message",
        label: "Pesan saat form seleksi ditutup",
        hint: "Tampil jika toggle pendaftaran ambalan nonaktif.",
        sample:
          "Form seleksi calon pengurus sedang ditutup. Pantau pengumuman di berita atau hubungi pembina pramuka.",
      },
    ],
  },
  organization: {
    path: "/anggota",
    pathTitle: "Struktur dewan (publik)",
    pageKey: "organization",
    rows: [
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul halaman struktur",
        hint: "Teks di bawah judul halaman /anggota.",
        sample: "Pengurus aktif masa bakti 2026/2027 SMK Al Furqon Bantarkawung",
      },
      {
        section: "hero",
        entry: "title",
        label: "Judul halaman struktur (h1)",
        sample: "Struktur Dewan Ambalan",
      },
      {
        section: "empty",
        entry: "no_members",
        label: "Teks jika belum ada pengurus terdaftar",
        sample: "Belum ada pengurus Dewan Ambalan dengan jabatan terdaftar.",
      },
      {
        section: "empty",
        entry: "admin_help",
        label: "Petunjuk admin (di bawah teks kosong)",
        hint: "Hanya ditampilkan untuk admin; tautan Kelola Jabatan tetap dari kode.",
        sample:
          "Pergi ke Kelola Jabatan untuk menambah jabatan dan mengassign anggota.",
      },
    ],
  },
  footer: {
    path: null,
    pathTitle: "Footer (semua halaman dengan layout portal)",
    pageKey: "footer",
    rows: [
      {
        section: "brand",
        entry: "motto",
        label: "Motto organisasi di footer",
        hint: "Kutipan singkat di kolom brand footer.",
        sample: '"Satyaku Kudarmakan, Darmaku Kubaktikan"',
      },
    ],
  },
  daftar_ambalan: {
    path: "/daftar-ambalan",
    pathTitle: "Form seleksi calon pengurus",
    pageKey: "daftar_ambalan",
    rows: [
      {
        section: "hero",
        entry: "title",
        label: "Judul hero halaman seleksi",
        hint: "Judul utama halaman daftar.",
        sample: "Pendaftaran calon pengurus ambalan",
      },
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul hero",
        hint: "Deskripsi singkat di bawah judul.",
        sample: "Ruang untuk siswa yang aktif di kegiatan pramuka…",
      },
      {
        section: "syarat",
        entry: "body",
        label: "Isi syarat (beberapa baris)",
        hint: "Tiap baris bisa dipisah Enter; tampil sebagai daftar di form.",
        sample: "Aktif mengikuti kegiatan pramuka.\nSiap menjaga nama baik ambalan.",
      },
      {
        section: "timeline",
        entry: "step1_label",
        label: "Langkah 1 — label",
        hint: "Judul singkat langkah pertama timeline.",
        sample: "Pendaftaran",
      },
      {
        section: "timeline",
        entry: "step1_desc",
        label: "Langkah 1 — deskripsi",
        hint: "Penjelasan langkah 1.",
        sample: "Isi data dan motivasi",
      },
      {
        section: "timeline",
        entry: "step2_label",
        label: "Langkah 2 — label",
        sample: "Seleksi",
      },
      {
        section: "timeline",
        entry: "step2_desc",
        label: "Langkah 2 — deskripsi",
        sample: "Wawancara dan penilaian komitmen",
      },
      {
        section: "timeline",
        entry: "step3_label",
        label: "Langkah 3 — label",
        sample: "Pelantikan",
      },
      {
        section: "timeline",
        entry: "step3_desc",
        label: "Langkah 3 — deskripsi",
        sample: "Penetapan masa bakti",
      },
    ],
  },
  kegiatan: {
    path: "/kegiatan",
    pathTitle: "Jadwal kegiatan",
    pageKey: "kegiatan",
    rows: [
      {
        section: "hero",
        entry: "title",
        label: "Judul halaman (h1)",
        sample: "Jadwal Kegiatan",
      },
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul hero",
        sample: "Program dan kegiatan Dewan Ambalan SMK Al Furqon",
      },
      {
        section: "upcoming",
        entry: "section_title",
        label: "Judul blok kegiatan mendatang",
        sample: "Kegiatan Mendatang",
      },
      {
        section: "upcoming",
        entry: "count_suffix",
        label: "Sufiks jumlah mendatang",
        hint: "Angka jumlah ditambah di depan otomatis, mis. \"5 kegiatan yang akan datang\".",
        sample: "kegiatan yang akan datang",
      },
      {
        section: "upcoming",
        entry: "empty",
        label: "Teks jika tidak ada kegiatan mendatang",
        sample: "Tidak ada kegiatan mendatang saat ini.",
      },
      {
        section: "past",
        entry: "section_title",
        label: "Judul blok kegiatan selesai",
        sample: "Kegiatan Selesai",
      },
      {
        section: "past",
        entry: "count_suffix",
        label: "Sufiks jumlah kegiatan lampau",
        sample: "kegiatan yang telah berlangsung",
      },
    ],
  },
  berita: {
    path: "/berita",
    pathTitle: "Berita & artikel",
    pageKey: "berita",
    rows: [
      {
        section: "hero",
        entry: "title",
        label: "Judul halaman (h1)",
        sample: "Berita & Artikel",
      },
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul hero",
        sample: "Baca artikel terbaru tentang kegiatan dan prestasi Dewan Ambalan",
      },
      {
        section: "tabs",
        entry: "semua",
        label: "Tab filter — Semua",
        sample: "Semua",
      },
      {
        section: "tabs",
        entry: "pengumuman",
        label: "Tab filter — Pengumuman",
        sample: "Pengumuman",
      },
      {
        section: "tabs",
        entry: "kegiatan",
        label: "Tab filter — Kegiatan",
        sample: "Kegiatan",
      },
      {
        section: "tabs",
        entry: "prestasi",
        label: "Tab filter — Prestasi",
        sample: "Prestasi",
      },
      {
        section: "tabs",
        entry: "galeri",
        label: "Tab filter — Album",
        sample: "Album",
      },
      {
        section: "empty",
        entry: "no_posts",
        label: "Teks jika tidak ada post",
        sample: "Belum ada post untuk kategori ini.",
      },
      {
        section: "empty",
        entry: "view_all",
        label: "Tautan teks — lihat semua",
        sample: "Lihat semua post",
      },
      {
        section: "list",
        entry: "other_posts_title",
        label: "Judul grid post lainnya",
        sample: "Post Lainnya",
      },
      {
        section: "card",
        entry: "read_more",
        label: "Teks ajakan baca artikel unggulan",
        sample: "Baca selengkapnya",
      },
    ],
  },
  galeri: {
    path: "/galeri",
    pathTitle: "Galeri foto",
    pageKey: "galeri",
    rows: [
      {
        section: "hero",
        entry: "title",
        label: "Judul halaman (h1)",
        sample: "Galeri Foto",
      },
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul hero",
        sample: "Dokumentasi kegiatan dan momen berharga Dewan Ambalan SMK Al Furqon",
      },
    ],
  },
  keuangan: {
    path: "/keuangan",
    pathTitle: "Transparansi keuangan",
    pageKey: "keuangan",
    rows: [
      {
        section: "empty",
        entry: "title",
        label: "Judul saat belum ada data dipublikasikan",
        sample: "Transparansi keuangan",
      },
      {
        section: "empty",
        entry: "body",
        label: "Paragraf kosong (sertakan petunjuk admin)",
        sample:
          "Laporan keuangan belum dipublikasikan. Admin dapat mengunggah data melalui panel /admin/finance.",
      },
      {
        section: "hero",
        entry: "title",
        label: "Judul halaman (h1)",
        sample: "Transparansi keuangan",
      },
      {
        section: "hero",
        entry: "subtitle",
        label: "Subjudul di bawah judul",
        sample: "Dewan Ambalan SMK Al Furqon — laporan yang dipublikasikan untuk seluruh bidang.",
      },
      {
        section: "tabs",
        entry: "ringkasan",
        label: "Label tab ringkasan",
        sample: "Ringkasan",
      },
      {
        section: "ringkasan",
        entry: "kas_caption",
        label: "Keterangan blok saldo kas",
        sample: "Kas (saldo akhir periode terbaru)",
      },
      {
        section: "ringkasan",
        entry: "period_prefix",
        label: "Awalan label periode terbaru",
        sample: "Periode:",
      },
      {
        section: "ringkasan",
        entry: "monthly_title",
        label: "Judul tabel ikhtisar per bulan",
        sample: "Ikhtisar per bulan",
      },
      {
        section: "table_summary",
        entry: "col_period",
        label: "Kolom — periode",
        sample: "Periode",
      },
      {
        section: "table_summary",
        entry: "col_income",
        label: "Kolom — pemasukan",
        sample: "Pemasukan",
      },
      {
        section: "table_summary",
        entry: "col_expense",
        label: "Kolom — pengeluaran",
        sample: "Pengeluaran",
      },
      {
        section: "table_summary",
        entry: "col_balance",
        label: "Kolom — saldo akhir",
        sample: "Saldo akhir",
      },
      {
        section: "detail",
        entry: "saldo_awal",
        label: "Label saldo awal (detail bulan)",
        sample: "Saldo awal",
      },
      {
        section: "detail",
        entry: "saldo_akhir",
        label: "Label saldo akhir (detail bulan)",
        sample: "Saldo akhir",
      },
      {
        section: "detail",
        entry: "transactions_title",
        label: "Judul blok rincian transaksi",
        sample: "Rincian transaksi",
      },
      {
        section: "table_tx",
        entry: "col_date",
        label: "Kolom — tanggal",
        sample: "Tanggal",
      },
      {
        section: "table_tx",
        entry: "col_type",
        label: "Kolom — jenis",
        sample: "Jenis",
      },
      {
        section: "table_tx",
        entry: "col_desc",
        label: "Kolom — keterangan",
        sample: "Keterangan",
      },
      {
        section: "table_tx",
        entry: "col_amount",
        label: "Kolom — jumlah",
        sample: "Jumlah",
      },
      {
        section: "detail",
        entry: "no_transactions",
        label: "Teks jika tidak ada transaksi di bulan",
        sample: "Tidak ada transaksi tercatat.",
      },
    ],
  },
};

/** Pasangan section+entry yang terdaftar untuk satu page_key (untuk filter entri "kustom"). */
export function getCmsBindingKeySet(pageKey) {
  const spec = CMS_PUBLIC_BINDINGS[pageKey];
  if (!spec?.rows) return new Set();
  return new Set(spec.rows.map((r) => `${r.section}\t${r.entry}`));
}
