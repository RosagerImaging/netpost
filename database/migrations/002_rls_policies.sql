-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosslisting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Platform credentials policies
CREATE POLICY "Users can view own credentials" ON platform_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON platform_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON platform_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" ON platform_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Inventory items policies
CREATE POLICY "Users can view own inventory" ON inventory_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" ON inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- Marketplace listings policies (via inventory items)
CREATE POLICY "Users can view own listings" ON marketplace_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE inventory_items.id = marketplace_listings.inventory_item_id 
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own listings" ON marketplace_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE inventory_items.id = marketplace_listings.inventory_item_id 
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own listings" ON marketplace_listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE inventory_items.id = marketplace_listings.inventory_item_id 
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own listings" ON marketplace_listings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE inventory_items.id = marketplace_listings.inventory_item_id 
      AND inventory_items.user_id = auth.uid()
    )
  );

-- Cross-listing requests policies
CREATE POLICY "Users can view own crosslisting requests" ON crosslisting_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crosslisting requests" ON crosslisting_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crosslisting requests" ON crosslisting_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crosslisting requests" ON crosslisting_requests
  FOR DELETE USING (auth.uid() = user_id);

-- SEO analyses policies
CREATE POLICY "Users can view own seo analyses" ON seo_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seo analyses" ON seo_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seo analyses" ON seo_analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own seo analyses" ON seo_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Sales analytics policies
CREATE POLICY "Users can view own analytics" ON sales_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON sales_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON sales_analytics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analytics" ON sales_analytics
  FOR DELETE USING (auth.uid() = user_id);

-- Tax documents policies
CREATE POLICY "Users can view own tax documents" ON tax_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax documents" ON tax_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax documents" ON tax_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax documents" ON tax_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Receipts policies
CREATE POLICY "Users can view own receipts" ON receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts" ON receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts" ON receipts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts" ON receipts
  FOR DELETE USING (auth.uid() = user_id);