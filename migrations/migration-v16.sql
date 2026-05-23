-- ============================================================
-- Migration v16 — Rename columns to Indonesian
-- Menyesuaikan nama kolom dengan format Buku Arsip
-- ============================================================

-- Certificates: rename columns
ALTER TABLE certificates RENAME COLUMN code TO kode;
ALTER TABLE certificates RENAME COLUMN nomor_sertifikat TO nomor;
ALTER TABLE certificates RENAME COLUMN recipient_name TO nama_penerima;
ALTER TABLE certificates RENAME COLUMN certificate_type TO jenis_sertifikat;
ALTER TABLE certificates RENAME COLUMN dewan_ambalan TO penerbit;
ALTER TABLE certificates RENAME COLUMN description TO keterangan;

-- Vouchers: rename columns
ALTER TABLE vouchers RENAME COLUMN code TO kode;
ALTER TABLE vouchers RENAME COLUMN title TO judul;
ALTER TABLE vouchers RENAME COLUMN description TO keterangan;
ALTER TABLE vouchers RENAME COLUMN expires_at TO kadaluarsa;
