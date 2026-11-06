-- ============================================================
-- Migration v17 — Portal Verifikasi Dokumen
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Run
-- Tabel baru documents + verification_scans. Tabel lama TIDAK di-drop.
-- ============================================================

-- Fungsi trigger updated_at (bila belum ada)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'Asia/Jakarta';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- Tabel documents
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kode            TEXT        NOT NULL UNIQUE,
  jenis           TEXT        NOT NULL CHECK (jenis IN ('sertifikat','piagam','surat','voucher')),
  nomor           TEXT,
  judul           TEXT        NOT NULL,
  penerima        TEXT,
  penerbit        TEXT,
  keterangan      TEXT,
  status          TEXT        NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','revoked')),
  tanggal_terbit  DATE,
  tanggal_kadaluarsa DATE,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_kode    ON documents(kode);
CREATE INDEX IF NOT EXISTS idx_documents_jenis   ON documents(jenis);
CREATE INDEX IF NOT EXISTS idx_documents_status  ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_nomor   ON documents(nomor);

DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- Tanpa policy publik: endpoint publik pakai service-role.

-- ────────────────────────────────────────────────────────────
-- Tabel verification_scans
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_scans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        REFERENCES documents(id) ON DELETE CASCADE,
  scanned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  TEXT,
  metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_verification_scans_document
  ON verification_scans(document_id);
CREATE INDEX IF NOT EXISTS idx_verification_scans_scanned
  ON verification_scans(scanned_at);

ALTER TABLE verification_scans ENABLE ROW LEVEL SECURITY;
-- Tanpa policy publik: endpoint publik pakai service-role.
