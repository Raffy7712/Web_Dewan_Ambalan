-- ============================================================
-- Migration v5 — Program Unggulan + Portal Ambalan + CMS page
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- (Membutuhkan fungsi update_updated_at() dari migrasi sebelumnya)
-- ============================================================

-- ── Program unggulan (home, editable admin) ─────────────────
CREATE TABLE IF NOT EXISTS featured_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trigger_update_featured_programs_updated_at ON featured_programs;
CREATE TRIGGER trigger_update_featured_programs_updated_at
  BEFORE UPDATE ON featured_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_featured_programs_active_sort
  ON featured_programs(is_active, sort_order);

ALTER TABLE featured_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "featured_programs_no_public_read" ON featured_programs;
CREATE POLICY "featured_programs_no_public_read"
  ON featured_programs FOR SELECT USING (false);

INSERT INTO featured_programs (title, description, sort_order, is_active)
SELECT * FROM (
  VALUES
    (
      'Perkemahan & penjelajahan',
      'Melatih ketangguhan, kemandirian, dan kecintaan terhadap alam melalui kegiatan lapangan di wilayah Brebes dan sekitarnya.',
      1,
      true
    ),
    (
      'Pengembangan kompetensi',
      'Lomba internal gugus depan dan persiapan LCTP tingkat Penggalang.',
      2,
      true
    )
) AS v(title, description, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM featured_programs LIMIT 1);

-- ── Site settings: pendaftaran seleksi + masa bakti ───────────
INSERT INTO site_settings (key, value_json)
VALUES
  ('ambalan_registration_enabled', '{"enabled": true}'::jsonb),
  (
    'masa_bakti',
    '{"display": "2026/2027", "period_key": "2026-2027"}'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

-- ── Permission CMS halaman daftar ambalan ────────────────────
INSERT INTO permission_keys (key, label, module)
VALUES
  ('content.daftar_ambalan.manage', 'Kelola konten halaman seleksi calon pengurus', 'content')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role, permission_key, allowed)
SELECT role_name, 'content.daftar_ambalan.manage',
  CASE WHEN role_name = 'admin' THEN true ELSE false END
FROM (VALUES ('admin'), ('moderator'), ('user')) AS roles(role_name)
ON CONFLICT (role, permission_key) DO NOTHING;
