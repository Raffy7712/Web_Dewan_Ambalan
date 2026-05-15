-- ============================================================
-- Migration v14 — Certificate Enhancement: Nomor Sertifikat & QR Code
-- Menambahkan kolom nomor_sertifikat (manual input) dan qr_code_url
-- pada tabel certificates untuk fitur QR code yang bisa di-download
-- ============================================================

-- Tambah kolom nomor_sertifikat: nomor urut/kode sertifikat manual
-- Format contoh: "001/11.29.02.165-02.166-C/2026"
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS nomor_sertifikat VARCHAR(100);

-- Tambah kolom qr_code_url: URL publik untuk verifikasi QR code
-- Berguna jika QR code mengarah ke halaman verifikasi online
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Tambah kolom qr_code_image: Base64 encoded QR code image
-- Supaya QR code yang di-generate bisa langsung di-download tanpa regenerate
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS qr_code_image TEXT;

-- Index untuk pencarian berdasarkan nomor_sertifikat
CREATE INDEX IF NOT EXISTS idx_certificates_nomor_sertifikat
  ON public.certificates(nomor_sertifikat);

-- Unique constraint untuk nomor_sertifikat (setiap nomor hanya boleh satu sertifikat)
-- Hanya di-apply jika belum ada, menggunakan WHERE clause agar NULL tidak conflict
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_nomor_sertifikat_unique
  ON public.certificates(nomor_sertifikat)
  WHERE nomor_sertifikat IS NOT NULL;

-- Tambah kolom deskripsi tambahan pada sertifikat
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Tambah kolom untuk menyimpan konteks Dewan Ambalan lebih detail
-- (gugus_depan, kwartir, dll) yang bisa dipakai di template sertifikat
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS issuer_detail JSONB DEFAULT '{}';

-- Update RLS: allow service role full access (untuk admin API yang pakai service_role)
-- Pastikan policy yang sudah ada tidak menghalangi admin operations
-- (service_role key sudah bypass RLS secara default, tapi untuk kejelasan:

-- Comment untuk dokumentasi
COMMENT ON COLUMN public.certificates.nomor_sertifikat IS 'Nomor urut/kode sertifikat manual, format contoh: 001/11.29.02.165-02.166-C/2026';
COMMENT ON COLUMN public.certificates.qr_code_url IS 'URL publik untuk verifikasi sertifikat via QR code scan';
COMMENT ON COLUMN public.certificates.qr_code_image IS 'Base64 encoded QR code image untuk download langsung';
COMMENT ON COLUMN public.certificates.description IS 'Deskripsi tambahan konten sertifikat';
COMMENT ON COLUMN public.certificates.issuer_detail IS 'Detail penerbit sertifikat (gugus_depan, kwartir, dll) dalam format JSON';
