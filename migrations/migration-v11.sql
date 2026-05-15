-- ============================================================
-- Migration v11 — Vouchers & Certificates Validation System
-- QR/Barcode validation untuk voucher dan sertifikat piagam
-- ============================================================

-- Table: vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  qr_code TEXT, -- JSON encoded QR data atau base64
  barcode TEXT, -- Barcode representation (code128)
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Flexible field untuk data tambahan
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  qr_code TEXT,
  barcode TEXT,
  recipient_name VARCHAR(255) NOT NULL,
  certificate_type VARCHAR(100) NOT NULL, -- e.g., "Penghargaan", "Sertifikat Keahlian", dll
  dewan_ambalan VARCHAR(255),
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: verification_scans (untuk tracking setiap scan)
CREATE TABLE IF NOT EXISTS public.verification_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('qr', 'barcode', 'code')),
  ip_address INET,
  metadata JSONB
);

-- Create indexes untuk performance
CREATE INDEX idx_vouchers_code ON public.vouchers(code);
CREATE INDEX idx_vouchers_status ON public.vouchers(status);
CREATE INDEX idx_vouchers_created_by ON public.vouchers(created_by);
CREATE INDEX idx_certificates_code ON public.certificates(code);
CREATE INDEX idx_certificates_status ON public.certificates(status);
CREATE INDEX idx_verification_scans_voucher_id ON public.verification_scans(voucher_id);
CREATE INDEX idx_verification_scans_certificate_id ON public.verification_scans(certificate_id);
CREATE INDEX idx_verification_scans_scanned_at ON public.verification_scans(scanned_at);

-- RLS (Row Level Security)
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk vouchers
CREATE POLICY "Vouchers readable by authenticated users" ON public.vouchers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only creators can update own vouchers" ON public.vouchers
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Only admins can create vouchers" ON public.vouchers
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name = 'admin'
  ));

-- RLS Policies untuk certificates
CREATE POLICY "Certificates readable by authenticated users" ON public.certificates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage certificates" ON public.certificates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name = 'admin'
  ));

-- RLS Policies untuk verification_scans
CREATE POLICY "Scans readable by authenticated users" ON public.verification_scans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create scans" ON public.verification_scans
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add permissions untuk module ini
INSERT INTO permission_keys (key, label, module)
VALUES
  ('voucher.create', 'Buat voucher baru', 'voucher'),
  ('voucher.view', 'Lihat daftar voucher', 'voucher'),
  ('voucher.verify', 'Verifikasi voucher', 'voucher'),
  ('certificate.create', 'Terbitkan sertifikat', 'certificate'),
  ('certificate.view', 'Lihat daftar sertifikat', 'certificate'),
  ('certificate.verify', 'Verifikasi sertifikat', 'certificate')
ON CONFLICT (key) DO NOTHING;

-- Assign permissions ke roles
INSERT INTO role_permissions (role, permission_key, allowed)
VALUES
  ('admin', 'voucher.create', true),
  ('admin', 'voucher.view', true),
  ('admin', 'voucher.verify', true),
  ('admin', 'certificate.create', true),
  ('admin', 'certificate.view', true),
  ('admin', 'certificate.verify', true),
  ('moderator', 'voucher.view', true),
  ('moderator', 'voucher.verify', true),
  ('moderator', 'certificate.view', true),
  ('moderator', 'certificate.verify', true),
  ('user', 'voucher.verify', true),
  ('user', 'certificate.verify', true)
ON CONFLICT (role, permission_key) DO NOTHING;
