# Web Dewan Ambalan — Portal Verifikasi Dokumen

Portal verifikasi dokumen (sertifikat, piagam, surat, voucher). Pengguna memasukkan
kode atau nomor+jenis untuk mengecek keaslian; admin mengelola dokumen via API.

## Stack
Next.js 16 (App Router), React 19, Tailwind 4, Supabase (REST via service-role).

## Jalankan migration v17
Buka Supabase Dashboard -> SQL Editor -> Run, lalu eksekusi `migrations/migration-v17.sql`.
Isi: tabel `documents` + `verification_scans`, index, trigger `set_updated_at`,
RLS aktif tanpa policy publik (endpoint publik akses via service-role).
Tabel lama tidak di-drop.

Variabel env:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- AUTH_SECRET

## Kontrak API

### Publik (tanpa auth, rate-limit 60/menit per IP)
`GET|POST /api/verification`
- GET:  `?kode=XXX`  ATAU  `?nomor=YYY&jenis=sertifikat|piagam|surat|voucher`
- POST: `{ "kode": "..." }`  ATAU  `{ "nomor": "...", "jenis": "..." }`
- 200: `{ ok, valid, message, type, jitem: { kode, jenis, judul, nomor, penerima, penerbit, status, tanggal_terbit, tanggal_kadaluarsa, keterangan } }`
- 404: dokumen tidak ditemukan
- `valid=false` bila `status='revoked'` atau (jenis voucher/surat) tanggal_kadaluarsa < hari ini.
- Setiap cek dicatat ke `verification_scans`.

### Admin (perlu login admin via cookie session)
`GET /api/admin/documents`  — list, query: `?jenis=&q=&page=`
`POST /api/admin/documents` — buat dokumen; server generate kode
  (prefix SRT/PIG/SUR/VCH + `-` + YYYY + `-` + 6 char A-Z0-9, cek unik).
  Body: `{ jenis, judul, nomor?, penerima?, penerbit?, keterangan?, tanggal_terbit?, tanggal_kadaluarsa? }`
`PATCH /api/admin/documents/[id]` — update field; set `status:'revoked'` untuk batalkan.
`DELETE /api/admin/documents/[id]` — hapus (scan ikut terhapus via FK cascade).

## Cara admin
Frontend dikerjakan terpisah (frontend-dev). Endpoint admin di atas dipanggil
dengan session admin (cookie `da_session`, role='admin').

## Catatan
- Next 16: `params`/`searchParams` adalah Promise (await).
- Lint: `npx eslint src/app/api src/lib`.
