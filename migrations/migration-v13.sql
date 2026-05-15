-- ============================================================
-- Migration v13 — Login Device & IP Verification System
-- Track login sessions, IPs, and send notifications for new IPs
-- ============================================================

-- Table: login_sessions
-- Tracks every login attempt with IP, user agent, location info
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  device_name TEXT, -- Generated from user_agent (e.g., "Chrome on macOS")
  location_info JSONB, -- Can store geo-location data if available
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON public.login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_ip_address ON public.login_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_timestamp ON public.login_sessions(login_timestamp DESC);

-- Table: trusted_devices
-- Stores IPs and devices that user has verified/marked as trusted
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  device_name TEXT,
  device_fingerprint TEXT, -- Hash of user_agent for comparison
  trusted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, ip_address) -- One device per IP per user
);

-- Index for trusted devices
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_ip_address ON public.trusted_devices(ip_address);

-- Table: new_ip_alerts
-- Tracks which new IP logins have been alerted to users
CREATE TABLE IF NOT EXISTS public.new_ip_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for alert lookups
CREATE INDEX IF NOT EXISTS idx_new_ip_alerts_user_id ON public.new_ip_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_new_ip_alerts_email_sent ON public.new_ip_alerts(email_sent);

-- Enable RLS on all tables
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_ip_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_sessions
-- Users can only view their own login sessions
CREATE POLICY "Users can view their own login sessions"
  ON public.login_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for trusted_devices
-- Users can only view their own trusted devices
CREATE POLICY "Users can view their own trusted devices"
  ON public.trusted_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own trusted devices
CREATE POLICY "Users can insert their own trusted devices"
  ON public.trusted_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete their own trusted devices"
  ON public.trusted_devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for new_ip_alerts
-- Users can only view their own alerts
CREATE POLICY "Users can view their own IP alerts"
  ON public.new_ip_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can dismiss their own alerts
CREATE POLICY "Users can dismiss their own IP alerts"
  ON public.new_ip_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.login_sessions IS 'Track all login attempts with IP, user agent, timestamp for security audit';
COMMENT ON TABLE public.trusted_devices IS 'Devices/IPs that user has explicitly trusted or verified';
COMMENT ON TABLE public.new_ip_alerts IS 'Alerts sent when user logs in from new IP (for notification system)';
