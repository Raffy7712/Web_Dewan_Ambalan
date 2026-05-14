-- ============================================================
-- Migration v6 — Kategori post "galeri" (album dokumentasi)
-- Jalankan di Supabase SQL Editor setelah migrasi sebelumnya.
-- Jika error "constraint ... does not exist", abaikan baris DROP
-- lalu jalankan hanya ADD (sesuaikan nama constraint di DB Anda).
-- ============================================================

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_category_check
  CHECK (
    category IN (
      'pengumuman',
      'kegiatan',
      'prestasi',
      'galeri'
    )
  );
