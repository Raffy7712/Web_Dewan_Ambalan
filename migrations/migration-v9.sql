-- ============================================================
-- Migration v9 — Buku agenda surat masuk & keluar (admin only)
-- Jalankan di Supabase SQL Editor setelah migrasi sebelumnya.
-- Akses data hanya lewat service role (createAdminClient).
-- ============================================================

CREATE TABLE IF NOT EXISTS surat_masuk (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_diterima DATE NOT NULL,
  nomor_surat      TEXT NOT NULL,
  tanggal_surat    DATE,
  dari             TEXT NOT NULL,
  perihal          TEXT NOT NULL,
  catatan          TEXT,
  lampiran_url     TEXT,
  created_by       UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS surat_keluar (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_keluar   DATE NOT NULL,
  nomor_surat      TEXT NOT NULL,
  kepada           TEXT NOT NULL,
  perihal          TEXT NOT NULL,
  catatan          TEXT,
  lampiran_url     TEXT,
  created_by       UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trg_surat_masuk_updated ON surat_masuk;
CREATE TRIGGER trg_surat_masuk_updated
  BEFORE UPDATE ON surat_masuk
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_surat_keluar_updated ON surat_keluar;
CREATE TRIGGER trg_surat_keluar_updated
  BEFORE UPDATE ON surat_keluar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_surat_masuk_tanggal ON surat_masuk(tanggal_diterima DESC);
CREATE INDEX IF NOT EXISTS idx_surat_keluar_tanggal ON surat_keluar(tanggal_keluar DESC);

ALTER TABLE surat_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_keluar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surat_masuk_no_public" ON surat_masuk;
CREATE POLICY "surat_masuk_no_public"
  ON surat_masuk FOR SELECT USING (false);

DROP POLICY IF EXISTS "surat_keluar_no_public" ON surat_keluar;
CREATE POLICY "surat_keluar_no_public"
  ON surat_keluar FOR SELECT USING (false);
