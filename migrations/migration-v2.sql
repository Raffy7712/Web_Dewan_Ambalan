-- ============================================================
-- Migration v2 — Jabatan + OTP email_verify type
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- (Jalankan SETELAH migration.sql)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Update otp_tokens: tambah kolom type untuk email_verify
-- ────────────────────────────────────────────────────────────
ALTER TABLE otp_tokens
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'password_reset'
    CHECK (type IN ('password_reset', 'email_verify'));

CREATE INDEX IF NOT EXISTS idx_otp_type ON otp_tokens(type);

-- ────────────────────────────────────────────────────────────
-- 2. Tabel jabatan — list posisi yang bisa di-assign ke anggota
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jabatan (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama     TEXT NOT NULL UNIQUE,
  urutan   INT  DEFAULT 0,  -- untuk sorting tampilan
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- Jabatan default
INSERT INTO jabatan (nama, urutan) VALUES
  ('Pradana Putra', 1),
  ('Pradana Putri', 2)
ON CONFLICT (nama) DO NOTHING;

-- RLS: jabatan bisa dibaca publik, ditulis hanya admin (via admin client)
ALTER TABLE jabatan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jabatan_public_read" ON jabatan;
CREATE POLICY "jabatan_public_read" ON jabatan FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 3. Tambah jabatan_id ke accounts
-- ────────────────────────────────────────────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS jabatan_id UUID REFERENCES jabatan(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_jabatan ON accounts(jabatan_id);
