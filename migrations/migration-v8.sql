-- ============================================================
-- Migration v8 — Laporan keuangan ambalan (transparansi)
-- Jalankan di Supabase SQL Editor setelah migrasi sebelumnya.
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_months (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year            INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month           INT NOT NULL CHECK (month >= 1 AND month <= 12),
  saldo_awal      NUMERIC(16, 2) NOT NULL DEFAULT 0,
  catatan_publik  TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_by      UUID REFERENCES accounts(id) ON DELETE SET NULL,
  UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id    UUID NOT NULL REFERENCES finance_months(id) ON DELETE CASCADE,
  tanggal     DATE NOT NULL,
  jenis       TEXT NOT NULL CHECK (jenis IN ('pemasukan', 'pengeluaran')),
  keterangan  TEXT NOT NULL,
  jumlah      NUMERIC(16, 2) NOT NULL CHECK (jumlah > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_finance_tx_month ON finance_transactions(month_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_tanggal ON finance_transactions(month_id, tanggal);

DROP TRIGGER IF EXISTS trg_finance_months_updated ON finance_months;
CREATE TRIGGER trg_finance_months_updated
  BEFORE UPDATE ON finance_months
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE finance_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
