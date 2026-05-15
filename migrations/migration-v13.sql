-- ============================================================
-- Migration v13 — Shop Feature (Kewirausahaan Bidang)
-- Product management, orders, shopping cart, payment integration
-- ============================================================

-- Table: shop_categories
CREATE TABLE IF NOT EXISTS public.shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: shop_products
CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  cost DECIMAL(12, 2), -- Harga modal untuk tracking margin
  stock INT DEFAULT 0,
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  images JSONB, -- Array of image URLs
  sku VARCHAR(100) UNIQUE,
  weight INT, -- Berat dalam gram (untuk shipping)
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB -- Flexible field
);

-- Table: shopping_carts
CREATE TABLE IF NOT EXISTS public.shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  price_at_time DECIMAL(12, 2), -- Captured price when added to cart
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Table: shop_orders
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) DEFAULT 0,
  shipping_cost DECIMAL(12, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  payment_method VARCHAR(50), -- 'QRIS', 'BANK_TRANSFER', 'EWALLET', etc.
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded')),
  payment_ref VARCHAR(255), -- Reference ID dari payment gateway
  tripay_ref VARCHAR(255), -- Tripay transaction reference
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: shop_order_items
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  price DECIMAL(12, 2) NOT NULL, -- Price at order time
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: shop_order_payments
CREATE TABLE IF NOT EXISTS public.shop_order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  tripay_reference VARCHAR(255),
  tripay_data JSONB, -- Full response dari Tripay
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: shop_promo_codes
CREATE TABLE IF NOT EXISTS public.shop_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12, 2) NOT NULL,
  max_uses INT,
  current_uses INT DEFAULT 0,
  min_order_amount DECIMAL(12, 2),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_shop_products_slug ON public.shop_products(slug);
CREATE INDEX idx_shop_products_category_id ON public.shop_products(category_id);
CREATE INDEX idx_shop_products_status ON public.shop_products(status);
CREATE INDEX idx_shopping_carts_user_id ON public.shopping_carts(user_id);
CREATE INDEX idx_shop_orders_user_id ON public.shop_orders(user_id);
CREATE INDEX idx_shop_orders_status ON public.shop_orders(status);
CREATE INDEX idx_shop_orders_payment_status ON public.shop_orders(payment_status);
CREATE INDEX idx_shop_orders_order_number ON public.shop_orders(order_number);
CREATE INDEX idx_shop_order_items_order_id ON public.shop_order_items(order_id);
CREATE INDEX idx_shop_order_payments_order_id ON public.shop_order_payments(order_id);
CREATE INDEX idx_shop_promo_codes_code ON public.shop_promo_codes(code);

-- RLS
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Categories readable by all" ON public.shop_categories
  FOR SELECT USING (true);

CREATE POLICY "Products readable by all (active only)" ON public.shop_products
  FOR SELECT USING (status = 'active' OR EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name IN ('admin', 'moderator')
  ));

CREATE POLICY "Only admins can manage products" ON public.shop_products
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name = 'admin'
  ));

CREATE POLICY "Only admins can update products" ON public.shop_products
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name = 'admin'
  ));

CREATE POLICY "Cart readable by owner" ON public.shopping_carts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can manage own cart" ON public.shopping_carts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Orders readable by owner or admin" ON public.shop_orders
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name IN ('admin', 'moderator')
  ));

CREATE POLICY "Authenticated users can create orders" ON public.shop_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Order items readable by order owner or admin" ON public.shop_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.shop_orders o 
    WHERE o.id = order_id AND (o.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND role_name IN ('admin', 'moderator')))
  ));

CREATE POLICY "Promo codes readable by all" ON public.shop_promo_codes
  FOR SELECT USING (true);

-- Add permissions
INSERT INTO permission_keys (key, label, module)
VALUES
  ('shop.manage_products', 'Manage shop products', 'shop'),
  ('shop.manage_orders', 'Manage shop orders', 'shop'),
  ('shop.view_orders', 'View shop orders', 'shop'),
  ('shop.manage_promos', 'Manage promo codes', 'shop')
ON CONFLICT (key) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role, permission_key, allowed)
VALUES
  ('admin', 'shop.manage_products', true),
  ('admin', 'shop.manage_orders', true),
  ('admin', 'shop.view_orders', true),
  ('admin', 'shop.manage_promos', true),
  ('moderator', 'shop.manage_products', false),
  ('moderator', 'shop.manage_orders', true),
  ('moderator', 'shop.view_orders', true),
  ('user', 'shop.view_orders', true)
ON CONFLICT (role, permission_key) DO NOTHING;
