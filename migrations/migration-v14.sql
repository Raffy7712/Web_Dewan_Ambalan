-- ============================================================
-- Migration v14 — Certificate Enhancement: Nomor Sertifikat, QR Code & Deskripsi
-- Menambahkan kolom nomor_sertifikat, qr_code_url, qr_code_image,
-- description, dan issuer_detail pada tabel certificates
-- ============================================================

-- Tambah kolom nomor_sertifikat: nomor urut/kode sertifikat manual
-- Format contoh: "001/11.29.02.165-02.166-C/2026"
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS nomor_sertifikat VARCHAR(100);

-- Tambah kolom qr_code_url: URL publik untuk verifikasi QR code
-- Berguna jika QR code mengarah ke halaman verifikasi online
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Tambah kolom qr_code_image: Base64 encoded QR code image
-- Supaya QR code yang di-generate bisa langsung di-download tanpa regenerate
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS qr_code_image TEXT;

-- Index untuk pencarian berdasarkan nomor_sertifikat
CREATE INDEX IF NOT EXISTS idx_certificates_nomor_sertifikat
  ON certificates(nomor_sertifikat);

-- Unique constraint untuk nomor_sertifikat (setiap nomor hanya boleh satu sertifikat)
-- Hanya di-apply jika belum ada, menggunakan WHERE clause agar NULL tidak conflict
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_nomor_sertifikat_unique
  ON certificates(nomor_sertifikat)
  WHERE nomor_sertifikat IS NOT NULL;

-- Tambah kolom description: deskripsi/alasan penerbitan sertifikat
-- Menjelaskan nama penerima dan alasan kenapa sertifikat dirilis
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Tambah kolom untuk menyimpan konteks Dewan Ambalan lebih detail
-- (gugus_depan, kwartir, dll) yang bisa dipakai di template sertifikat
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS issuer_detail JSONB DEFAULT '{}';

-- Tambah kolom description pada vouchers juga (jika belum ada)
-- Voucher juga perlu deskripsi yang menjelaskan nama dan alasan penerbitan
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Comment untuk dokumentasi
COMMENT ON COLUMN certificates.nomor_sertifikat IS 'Nomor urut/kode sertifikat manual, format contoh: 001/11.29.02.165-02.166-C/2026';
COMMENT ON COLUMN certificates.qr_code_url IS 'URL publik untuk verifikasi sertifikat via QR code scan';
COMMENT ON COLUMN certificates.qr_code_image IS 'Base64 encoded QR code image untuk download langsung';
COMMENT ON COLUMN certificates.description IS 'Deskripsi/alasan penerbitan sertifikat — menjelaskan nama penerima dan alasan kenapa sertifikat dirilis';
COMMENT ON COLUMN certificates.issuer_detail IS 'Detail penerbit sertifikat (gugus_depan, kwartir, dll) dalam format JSON';
COMMENT ON COLUMN vouchers.description IS 'Deskripsi/alasan penerbitan voucher — menjelaskan nama dan alasan kenapa voucher dirilis';
