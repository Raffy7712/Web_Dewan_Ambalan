import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";

const sections = [
  {
    id: "mulai",
    title: "Mulai cepat",
    paragraphs: [
      "Anda sudah login sebagai admin. Menu samping (atau strip horizontal di ponsel) memuat semua modul.",
      "Pengguna non-admin tidak dapat membuka /admin — jika perlu bantu moderator, atur lewat Manajemen admin (peran) lalu Role & izin.",
    ],
  },
  {
    id: "berita",
    title: "Posting berita & dokumentasi",
    paragraphs: [
      "Buka Posting berita (/admin/posts/new). Pilih jenis Kegiatan (butuh tanggal dan lokasi) atau Album dokumentasi.",
      "Lampiran berupa URL Google Drive (bukan upload file): minimal 1 foto, maksimal 10; video opsional hingga 5. Satu URL per baris. Foto pertama jadi sampul.",
      "Setelah terbit, posting tampil di Berita, Galeri, atau Jadwal kegiatan sesuai jenisnya.",
    ],
  },
  {
    id: "program",
    title: "Program Dewan Ambalan (landing dan beranda)",
    paragraphs: [
      "Daftar program di Program unggulan (/admin/programs) disimpan di basis data dan dipakai di beranda (/home) pada blok Fokus kegiatan.",
      "Halaman landing publik (/) memakai program yang sama (hanya entri aktif). Jika belum ada data, landing menampilkan contoh statis sampai Anda menambah program.",
      "Gunakan judul singkat dan deskripsi jelas; urutan bisa diubah dengan tombol naik atau turun.",
    ],
  },
  {
    id: "cms",
    title: "Content CMS",
    paragraphs: [
      "Pilih tab halaman (Landing, Home, Jadwal kegiatan, Berita, …), lalu gunakan kartu hijau “Blok teks di situs”: tiap kartu adalah satu teks yang benar-benar dipakai di halaman publik (ada status Published/Draft, pratinjau, dan tautan buka halaman).",
      "Tombol “Isi lewat form” / “Ubah di form” mengisi form simpan di bawah dengan kunci yang benar. Hanya Published yang tampil untuk pengunjung.",
      "Tab teks portal tambahan (Jadwal kegiatan, Berita, Galeri, Keuangan) memakai izin `content.portal.manage`; setelah update kode jalankan migration-v10.sql di Supabase bila belum.",
      "Entri dengan kunci di luar daftar kartu masuk ke bagian kunci kustom (expand) — biasanya tidak tampil di situs kecuali ada kode baru yang membacanya.",
    ],
  },
  {
    id: "agenda-surat",
    title: "Agenda & arsip surat (internal)",
    paragraphs: [
      "Menu Agenda & arsip surat (/admin/agenda-surat) adalah buku surat masuk dan surat keluar serta arsip operasional kantor dewan. Hanya admin yang melihat halaman ini; data tidak muncul di portal publik atau untuk anggota biasa.",
      "Setelah deploy pertama kali fitur ini, basis data perlu skrip migration-v9.sql (lihat berkas di repositori, jalankan di Supabase SQL Editor). Tanpa itu, penyimpanan akan gagal.",
      "CRUD lengkap (tambah, ubah, hapus) per entri; unduh Excel (.xlsx) dari halaman yang sama. Kebijakan dan ringkasan untuk agen pengembang: Kitab_Suci_Agent.txt butir 19 dan 22.",
    ],
  },
  {
    id: "pengaturan",
    title: "Pengaturan situs dan seleksi",
    paragraphs: [
      "Pengaturan situs: aktif atau nonaktif registrasi akun portal; toggle dan masa bakti untuk form Seleksi calon pengurus (/daftar-calon-dewan-ambalan).",
    ],
  },
  {
    id: "keuangan",
    title: "Transparansi keuangan",
    paragraphs: [
      "Keuangan: kelola periode bulanan, transaksi, lalu publikasikan agar muncul di halaman publik /keuangan.",
    ],
  },
  {
    id: "pengguna",
    title: "Akun dan moderasi",
    paragraphs: [
      "Akun dan blokir: lihat pengguna, blokir akun yang melanggar (dengan alasan opsional). Pengguna terblokir tidak dapat login.",
    ],
  },
  {
    id: "struktur",
    title: "Struktur dan jabatan",
    paragraphs: [
      "Struktur jabatan mengisi daftar jabatan dewan; anggota memilih jabatan di profil sesuai yang tersedia.",
    ],
  },
];

export default function AdminPanduanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
      <div className="flex items-start gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Panduan pengurus
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan penggunaan portal Dewan Ambalan untuk pengurus baru. Untuk
            detail teknis operasional (traffic, env), gunakan juga berkas
            Kitab_Suci_Agent.txt di repositori proyek.
          </p>
        </div>
      </div>

      <nav className="mb-10 p-4 rounded-xl border border-border bg-card text-sm">
        <p className="font-semibold text-foreground mb-2">Isi halaman</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-primary">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-3">
              {s.title}
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              {s.paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Kembali ke ringkasan admin
          <ExternalLink size={14} />
        </Link>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Lihat beranda publik
        </Link>
      </div>
    </div>
  );
}
