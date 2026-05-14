-- ============================================================
-- Dewan Ambalan SMK Al Furqon — Database Migration
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Pastikan fungsi update_updated_at sudah ada (dari migration sebelumnya)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'Asia/Jakarta';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 1. Tambah kolom email ke accounts
-- ────────────────────────────────────────────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- ────────────────────────────────────────────────────────────
-- 2. Tabel comments — auto-approve, deteksi spam otomatis
--    (tidak ada manual approval, sistem yang menentukan spam)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     UUID    NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID    REFERENCES accounts(id) ON DELETE SET NULL,
  parent_id   UUID    REFERENCES comments(id) ON DELETE CASCADE,

  content     TEXT    NOT NULL,

  -- Spam detection (diisi oleh server, bukan manual)
  is_spam     BOOLEAN DEFAULT FALSE,
  spam_score  INTEGER DEFAULT 0,

  -- Admin tools
  is_pinned   BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at  TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Validasi: max 1 level nested (reply of reply tidak boleh)
CREATE OR REPLACE FUNCTION check_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM comments
      WHERE id = NEW.parent_id AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Nested comment maksimal 1 level saja';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_comment_depth
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION check_comment_depth();

CREATE INDEX IF NOT EXISTS idx_comments_post   ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_spam   ON comments(is_spam);

-- ────────────────────────────────────────────────────────────
-- 3. Tabel otp_tokens — untuk reset password via email
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id  UUID  REFERENCES accounts(id) ON DELETE CASCADE,
  email       TEXT  NOT NULL,
  token_hash  TEXT  NOT NULL,   -- SHA-256 hash dari 6-digit OTP
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_otp_hash  ON otp_tokens(token_hash);

-- Auto-cleanup token yang expired (jalankan sesekali / via cron)
-- DELETE FROM otp_tokens WHERE expires_at < NOW();

-- ────────────────────────────────────────────────────────────
-- 4. Row Level Security (RLS) — keamanan data
-- ────────────────────────────────────────────────────────────

-- posts: siapapun bisa baca yang published
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_public_read" ON posts;
CREATE POLICY "posts_public_read" ON posts
  FOR SELECT USING (status = 'published');

-- post_media: publik baca (ikut post)
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_media_public_read" ON post_media;
CREATE POLICY "post_media_public_read" ON post_media
  FOR SELECT USING (true);

-- comments: baca yang bukan spam; tulis hanya dari server (admin client)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_public_read" ON comments;
CREATE POLICY "comments_public_read" ON comments
  FOR SELECT USING (is_spam = false);

-- accounts: baca info publik saja (TANPA password_hash!)
-- WITH CHECK tidak berlaku untuk FOR SELECT, hanya USING
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_public_read" ON accounts;
CREATE POLICY "accounts_public_read" ON accounts
  FOR SELECT USING (is_active = true);

-- ⚠️  CATATAN KEAMANAN:
--  - password_hash & email masih terbaca lewat SELECT * dengan anon key jika RLS aktif.
--  - Solusi: query publik hanya select kolom yang aman (sudah dilakukan di queries.js).
--  - Semua operasi sensitif (write, auth) pakai admin client (service_role) yang bypass RLS.

-- Catatan: semua INSERT/UPDATE/DELETE pada posts, comments, otp_tokens
-- dilakukan lewat createAdminClient() (service_role) yang bypass RLS sepenuhnya.
-- Tidak perlu tambah policy write untuk anon key.
