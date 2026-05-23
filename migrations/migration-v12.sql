-- ============================================================
-- Migration v12 — Inventory Management System (Sarana Prasarana)
-- Untuk bidang sarana prasarana: manajemen barang, maintenance, pengecekan
-- ============================================================

-- Table: inventory_categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  description TEXT,
  quantity INT DEFAULT 1,
  unit VARCHAR(50), -- "unit", "pieces", "set", etc.
  condition VARCHAR(20) DEFAULT 'baik' CHECK (condition IN ('baik', 'perlu_perbaikan', 'rusak')),
  location VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(12, 2),
  last_checked TIMESTAMP WITH TIME ZONE,
  last_checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB -- For flexible data storage
);

-- Table: maintenance_logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  maintenance_type VARCHAR(100) NOT NULL, -- e.g., "cleaning", "repair", "calibration", etc.
  description TEXT,
  done_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cost DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: item_checks
CREATE TABLE IF NOT EXISTS item_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  check_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('baik', 'perlu_perbaikan', 'rusak')),
  notes TEXT,
  requires_maintenance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes untuk performance
CREATE INDEX idx_inventory_items_code ON inventory_items(code);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_condition ON inventory_items(condition);
CREATE INDEX idx_inventory_items_location ON inventory_items(location);
CREATE INDEX idx_maintenance_logs_item_id ON maintenance_logs(item_id);
CREATE INDEX idx_maintenance_logs_date ON maintenance_logs(maintenance_date);
CREATE INDEX idx_item_checks_item_id ON item_checks(item_id);
CREATE INDEX idx_item_checks_date ON item_checks(check_date);

-- RLS (Row Level Security)
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk inventory_categories
CREATE POLICY "Categories readable by authenticated users" ON inventory_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can modify categories" ON inventory_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies untuk inventory_items
CREATE POLICY "Items readable by authenticated users" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Creators can update own items" ON inventory_items
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create items" ON inventory_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies untuk maintenance_logs
CREATE POLICY "Maintenance logs readable by authenticated users" ON maintenance_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create maintenance logs" ON maintenance_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies untuk item_checks
CREATE POLICY "Item checks readable by authenticated users" ON item_checks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create item checks" ON item_checks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
