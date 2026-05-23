-- ============================================================
-- Migration v15 — Fix Schema Gaps
-- 1. Add 'nomor_surat' to verification_scans.verification_type CHECK
-- 2. Create missing v13 tables (login_sessions, trusted_devices, new_ip_alerts)
-- 3. Add 'galeri' to posts.category CHECK
-- ============================================================

-- ── 1. Fix verification_scans CHECK ──────────────────────────
-- Drop old constraint and add new one with 'nomor_surat'
ALTER TABLE verification_scans
  DROP CONSTRAINT IF EXISTS verification_scans_verification_type_check;

ALTER TABLE verification_scans
  ADD CONSTRAINT verification_scans_verification_type_check
  CHECK (verification_type IN ('qr', 'barcode', 'code', 'nomor_surat'));

-- ── 2. Create missing v13 tables ─────────────────────────────

-- Table: login_sessions
CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  device_name TEXT,
  location_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id
  ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_ip_address
  ON login_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_timestamp
  ON login_sessions(login_timestamp DESC);

-- Table: trusted_devices
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  device_name TEXT,
  device_fingerprint TEXT,
  trusted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id
  ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_ip_address
  ON trusted_devices(ip_address);

-- Table: new_ip_alerts
CREATE TABLE IF NOT EXISTS new_ip_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_new_ip_alerts_user_id
  ON new_ip_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_new_ip_alerts_email_sent
  ON new_ip_alerts(email_sent);

-- RLS for login_sessions
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own login sessions"
  ON login_sessions FOR SELECT
  USING (user_id::uuid IN (SELECT id FROM accounts WHERE id = user_id::uuid));

-- RLS for trusted_devices
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trusted devices"
  ON trusted_devices FOR SELECT
  USING (user_id::uuid IN (SELECT id FROM accounts WHERE id = user_id::uuid));

CREATE POLICY "Users can insert their own trusted devices"
  ON trusted_devices FOR INSERT
  WITH CHECK (user_id::uuid IN (SELECT id FROM accounts WHERE id = user_id::uuid));

CREATE POLICY "Users can delete their own trusted devices"
  ON trusted_devices FOR DELETE
  USING (user_id::uuid IN (SELECT id FROM accounts WHERE id = user_id::uuid));

-- RLS for new_ip_alerts
ALTER TABLE new_ip_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own IP alerts"
  ON new_ip_alerts FOR SELECT
  USING (user_id::uuid IN (SELECT id FROM accounts WHERE id = user_id::uuid));

CREATE POLICY "Users can dismiss their own alerts"
  ON new_ip_alerts FOR UPDATE
  USING (user_id::uuid IN (SELECT id FROM accounts WHERE id = user_id::uuid));

-- ── 3. Fix posts.category CHECK ──────────────────────────────
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_category_check
  CHECK (category IN ('pengumuman', 'kegiatan', 'prestasi', 'galeri'));

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE login_sessions IS 'Track all login attempts with IP, user agent, timestamp for security audit';
COMMENT ON TABLE trusted_devices IS 'Devices/IPs that user has explicitly trusted or verified';
COMMENT ON TABLE new_ip_alerts IS 'Alerts sent when user logs in from new IP (for notification system)';
