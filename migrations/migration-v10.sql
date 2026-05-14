-- ============================================================
-- Migration v10 — Izin CMS untuk teks halaman portal
-- (kegiatan, berita, galeri, keuangan + map agregat di kode)
-- Jalankan di Supabase SQL Editor setelah migrasi sebelumnya.
-- ============================================================

INSERT INTO permission_keys (key, label, module)
VALUES
  (
    'content.portal.manage',
    'Kelola teks halaman portal (jadwal, berita, galeri, keuangan)',
    'content'
  )
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role, permission_key, allowed)
SELECT role_name, 'content.portal.manage',
  CASE WHEN role_name = 'admin' THEN true ELSE false END
FROM (VALUES ('admin'), ('moderator'), ('user')) AS roles(role_name)
ON CONFLICT (role, permission_key) DO NOTHING;
