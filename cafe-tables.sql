-- Cafe Tables with User-Specific Data Isolation

-- 1. Tables tablosu (Masalar)
CREATE TABLE IF NOT EXISTS cafe_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'empty' CHECK (status IN ('empty', 'occupied')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(number, user_id)
);

-- 2. Cafe Products tablosu (Kafe ürünleri)
CREATE TABLE IF NOT EXISTS cafe_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT DEFAULT 'drink' CHECK (category IN ('drink', 'food', 'other')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cafe Orders tablosu (Siparişler)
CREATE TABLE IF NOT EXISTS cafe_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES cafe_tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cafe Order Items tablosu (Sipariş kalemleri)
CREATE TABLE IF NOT EXISTS cafe_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES cafe_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES cafe_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

-- 1. cafe_tables için RLS
ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tables" ON cafe_tables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tables" ON cafe_tables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tables" ON cafe_tables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tables" ON cafe_tables
  FOR DELETE USING (auth.uid() = user_id);

-- 2. cafe_products için RLS
ALTER TABLE cafe_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products" ON cafe_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON cafe_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON cafe_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON cafe_products
  FOR DELETE USING (auth.uid() = user_id);

-- 3. cafe_orders için RLS
ALTER TABLE cafe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON cafe_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON cafe_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON cafe_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" ON cafe_orders
  FOR DELETE USING (auth.uid() = user_id);

-- 4. cafe_order_items için RLS
ALTER TABLE cafe_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items" ON cafe_order_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order items" ON cafe_order_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own order items" ON cafe_order_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own order items" ON cafe_order_items
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_cafe_tables_user_id ON cafe_tables(user_id);
CREATE INDEX idx_cafe_products_user_id ON cafe_products(user_id);
CREATE INDEX idx_cafe_orders_user_id ON cafe_orders(user_id);
CREATE INDEX idx_cafe_orders_table_id ON cafe_orders(table_id);
CREATE INDEX idx_cafe_order_items_user_id ON cafe_order_items(user_id);
CREATE INDEX idx_cafe_order_items_order_id ON cafe_order_items(order_id);

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_cafe_tables_updated_at BEFORE UPDATE ON cafe_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafe_products_updated_at BEFORE UPDATE ON cafe_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafe_orders_updated_at BEFORE UPDATE ON cafe_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 