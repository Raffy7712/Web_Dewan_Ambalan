-- ============================================================
-- Migration v3 - Pendaftaran Calon Dewan Ambalan 2026-2027
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

CREATE TABLE IF NOT EXISTS ambalan_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT '2026-2027',
  full_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  motivation TEXT NOT NULL,
  experience TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  reviewed_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  UNIQUE (account_id, period)
);

CREATE INDEX IF NOT EXISTS idx_ambalan_applications_account
  ON ambalan_applications(account_id);
CREATE INDEX IF NOT EXISTS idx_ambalan_applications_status
  ON ambalan_applications(status);
CREATE INDEX IF NOT EXISTS idx_ambalan_applications_period
  ON ambalan_applications(period);

DROP TRIGGER IF EXISTS trigger_update_ambalan_applications_updated_at
  ON ambalan_applications;
CREATE TRIGGER trigger_update_ambalan_applications_updated_at
  BEFORE UPDATE ON ambalan_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE ambalan_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ambalan_applications_no_public_read"
  ON ambalan_applications;
CREATE POLICY "ambalan_applications_no_public_read"
  ON ambalan_applications FOR SELECT
  USING (false);

-- Semua baca/tulis aplikasi dilakukan lewat service role di Server Actions.

-- Kunci tabel accounts dari anon client agar kolom sensitif seperti
-- password_hash dan email tidak bisa terbaca lewat SELECT manual.
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_public_read" ON accounts;
DROP POLICY IF EXISTS "accounts_no_public_read" ON accounts;
CREATE POLICY "accounts_no_public_read"
  ON accounts FOR SELECT
  USING (false);
