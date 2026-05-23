-- ============================================================
-- Migration v11 — Vouchers & Certificates Validation System
-- QR/Barcode validation untuk voucher dan sertifikat piagam
-- ============================================================

-- Table: vouchers
CREATE TABLE IF NOT EXISTS vouchers (
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
CREATE TABLE IF NOT EXISTS certificates (
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
CREATE TABLE IF NOT EXISTS verification_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('qr', 'barcode', 'code')),
  ip_address INET,
  metadata JSONB
);

-- Create indexes untuk performance
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_created_by ON vouchers(created_by);
CREATE INDEX idx_certificates_code ON certificates(code);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_verification_scans_voucher_id ON verification_scans(voucher_id);
CREATE INDEX idx_verification_scans_certificate_id ON verification_scans(certificate_id);
CREATE INDEX idx_verification_scans_scanned_at ON verification_scans(scanned_at);

-- RLS (Row Level Security)
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk vouchers
CREATE POLICY "Vouchers readable by authenticated users" ON vouchers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only creators can update own vouchers" ON vouchers
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Anyone can create vouchers" ON vouchers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies untuk certificates
CREATE POLICY "Certificates readable by authenticated users" ON certificates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can manage certificates" ON certificates
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies untuk verification_scans
CREATE POLICY "Scans readable by authenticated users" ON verification_scans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create scans" ON verification_scans
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
