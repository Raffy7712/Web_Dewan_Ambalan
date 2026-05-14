-- ============================================================
-- Migration v4 - Site Settings + CMS + Role Permissions
-- Jalankan di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

INSERT INTO site_settings (key, value_json)
VALUES ('registration_enabled', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS trigger_update_site_settings_updated_at ON site_settings;
CREATE TRIGGER trigger_update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_settings_no_public_read" ON site_settings;
CREATE POLICY "site_settings_no_public_read"
  ON site_settings FOR SELECT USING (false);

CREATE TABLE IF NOT EXISTS permission_keys (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL,
  permission_key TEXT NOT NULL REFERENCES permission_keys(key) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  PRIMARY KEY (role, permission_key)
);

DROP TRIGGER IF EXISTS trigger_update_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER trigger_update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE permission_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permission_keys_no_public_read" ON permission_keys;
DROP POLICY IF EXISTS "role_permissions_no_public_read" ON role_permissions;
CREATE POLICY "permission_keys_no_public_read"
  ON permission_keys FOR SELECT USING (false);
CREATE POLICY "role_permissions_no_public_read"
  ON role_permissions FOR SELECT USING (false);

INSERT INTO permission_keys (key, label, module)
VALUES
  ('settings.manage', 'Kelola site settings', 'settings'),
  ('content.home.manage', 'Kelola konten home/dashboard', 'content'),
  ('content.landing.manage', 'Kelola konten landing', 'content'),
  ('content.footer.manage', 'Kelola konten footer/cta', 'content'),
  ('content.org.manage', 'Kelola profil organisasi', 'content'),
  ('posts.manage', 'Kelola berita dan artikel', 'content'),
  ('gallery.manage', 'Kelola galeri', 'content'),
  ('roles.manage', 'Kelola role & permission', 'permissions')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role, permission_key, allowed)
SELECT role_name, key, CASE WHEN role_name = 'admin' THEN true ELSE false END
FROM (VALUES ('admin'), ('moderator'), ('user')) AS roles(role_name)
CROSS JOIN permission_keys
ON CONFLICT (role, permission_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS cms_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  entry_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  UNIQUE (page_key, section_key, entry_key)
);

DROP TRIGGER IF EXISTS trigger_update_cms_entries_updated_at ON cms_entries;
CREATE TRIGGER trigger_update_cms_entries_updated_at
  BEFORE UPDATE ON cms_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_cms_entries_page ON cms_entries(page_key);
CREATE INDEX IF NOT EXISTS idx_cms_entries_section ON cms_entries(section_key);
CREATE INDEX IF NOT EXISTS idx_cms_entries_published ON cms_entries(is_published);

ALTER TABLE cms_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_entries_no_public_read" ON cms_entries;
CREATE POLICY "cms_entries_no_public_read"
  ON cms_entries FOR SELECT USING (false);
