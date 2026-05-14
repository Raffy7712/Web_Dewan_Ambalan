-- ============================================================
-- Migration v7 — Ban akun + log traffic halaman
-- Jalankan di Supabase SQL Editor setelah migrasi sebelumnya.
-- ============================================================

-- ── accounts: status banned (terpisah dari is_active) ───────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_banned ON accounts(banned) WHERE banned = TRUE;

-- ── page_view_logs: agregasi traffic (isi dari middleware/API) ─
CREATE TABLE IF NOT EXISTS page_view_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_page_view_logs_created ON page_view_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_view_logs_path ON page_view_logs(path);

-- RLS aktif tanpa policy → klien anon/authenticated tidak bisa baca/tulis.
-- Service role (backend) melewati RLS.
ALTER TABLE page_view_logs ENABLE ROW LEVEL SECURITY;
