-- NetPost Database Setup - Apply this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/jtqzezsdbflalvgluegz/sql

-- =====================================================================
-- MIGRATION 001: Initial Schema
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types and enums
DO $$ BEGIN
  CREATE TYPE item_condition AS ENUM (
    'new',
    'new_with_tags', 
    'new_without_tags',
    'like_new',
    'excellent',
    'good',
    'fair',
    'poor'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE platform_enum AS ENUM (
    'ebay',
    'mercari',
    'poshmark',
    'facebook_marketplace',
    'depop',
    'etsy'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
    'active',
    'sold',
    'ended',
    'draft',
    'suspended',
    'out_of_stock'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE inventory_status AS ENUM (
    'active',
    'sold',
    'grayed_out',
    'draft',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'trial',
    'starter',
    'professional',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'past_due',
    'canceled',
    'trialing',
    'incomplete'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE crosslisting_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  subscription_tier subscription_tier NOT NULL DEFAULT 'trial',
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id VARCHAR(255),
  trial_end_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN DEFAULT FALSE,
  auto_optimize_seo BOOLEAN DEFAULT TRUE,
  enable_auto_delisting BOOLEAN DEFAULT TRUE,
  default_listing_duration INTEGER DEFAULT 7,
  email_notifications BOOLEAN DEFAULT TRUE,
  price_optimization_enabled BOOLEAN DEFAULT TRUE,
  ai_description_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Platform credentials table (encrypted)
CREATE TABLE IF NOT EXISTS platform_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform platform_enum NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  cost_basis DECIMAL(10,2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(10,2) NOT NULL,
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  condition item_condition NOT NULL,
  size VARCHAR(50),
  color VARCHAR(50),
  material VARCHAR(100),
  weight DECIMAL(8,2),
  dimensions JSONB, -- {length, width, height}
  listing_group_id UUID,
  status inventory_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sku)
);

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  platform platform_enum NOT NULL,
  platform_listing_id VARCHAR(255) NOT NULL,
  platform_edit_url TEXT,
  platform_view_url TEXT,
  status listing_status NOT NULL DEFAULT 'draft',
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  listing_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, platform_listing_id)
);

-- Cross-listing requests table
CREATE TABLE IF NOT EXISTS crosslisting_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_platform platform_enum NOT NULL,
  target_platforms platform_enum[] NOT NULL,
  inventory_items UUID[] NOT NULL,
  status crosslisting_status DEFAULT 'pending',
  optimize_seo BOOLEAN DEFAULT TRUE,
  generate_descriptions BOOLEAN DEFAULT FALSE,
  results JSONB DEFAULT '[]',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- SEO analyses table
CREATE TABLE IF NOT EXISTS seo_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  platform platform_enum NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  recommendations JSONB NOT NULL DEFAULT '[]',
  keyword_suggestions TEXT[] NOT NULL DEFAULT '{}',
  competitor_analysis JSONB,
  overall_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales analytics table
CREATE TABLE IF NOT EXISTS sales_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_costs DECIMAL(12,2) NOT NULL DEFAULT 0,
  items_sold INTEGER NOT NULL DEFAULT 0,
  average_selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  average_days_to_sell DECIMAL(8,2) NOT NULL DEFAULT 0,
  platform_breakdown JSONB NOT NULL DEFAULT '{}',
  category_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- Tax documents table
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_breakdown JSONB NOT NULL DEFAULT '{}',
  expense_categories JSONB NOT NULL DEFAULT '{}',
  document_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, document_type)
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  image_url TEXT,
  is_deductible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_inventory_item_id ON marketplace_listings(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_platform ON marketplace_listings(platform);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_crosslisting_requests_user_id ON crosslisting_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_crosslisting_requests_status ON crosslisting_requests(status);
CREATE INDEX IF NOT EXISTS idx_seo_analyses_user_id ON seo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_analyses_inventory_item_id ON seo_analyses(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_sales_analytics_user_id ON sales_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_documents_user_id ON tax_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(user_id, date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- MIGRATION 002: RLS Policies
-- =====================================================================

-- Enable Row Level Security on all tables
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

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
  FOR ALL USING (id = (select auth.uid()));

-- User preferences policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = (select auth.uid()));

-- Platform credentials policies
DROP POLICY IF EXISTS "Users can manage own platform credentials" ON platform_credentials;

CREATE POLICY "Users can manage own platform credentials" ON platform_credentials
  FOR ALL USING (user_id = (select auth.uid()));

-- Inventory items policies
DROP POLICY IF EXISTS "Users can manage own inventory items" ON inventory_items;

CREATE POLICY "Users can manage own inventory items" ON inventory_items
  FOR ALL USING (user_id = (select auth.uid()));

-- Marketplace listings policies
DROP POLICY IF EXISTS "Users can manage own marketplace listings" ON marketplace_listings;

CREATE POLICY "Users can manage own marketplace listings" ON marketplace_listings
  FOR ALL USING (
    inventory_item_id IN (
      SELECT id FROM inventory_items WHERE user_id = (select auth.uid())
    )
  );

-- Cross-listing requests policies
DROP POLICY IF EXISTS "Users can manage own crosslisting requests" ON crosslisting_requests;

CREATE POLICY "Users can manage own crosslisting requests" ON crosslisting_requests
  FOR ALL USING (user_id = (select auth.uid()));

-- SEO analyses policies
DROP POLICY IF EXISTS "Users can manage own SEO analyses" ON seo_analyses;

CREATE POLICY "Users can manage own SEO analyses" ON seo_analyses
  FOR ALL USING (user_id = (select auth.uid()));

-- Sales analytics policies
DROP POLICY IF EXISTS "Users can view own sales analytics" ON sales_analytics;

CREATE POLICY "Users can view own sales analytics" ON sales_analytics
  FOR ALL USING (user_id = (select auth.uid()));

-- Tax documents policies
DROP POLICY IF EXISTS "Users can manage own tax documents" ON tax_documents;

CREATE POLICY "Users can manage own tax documents" ON tax_documents
  FOR ALL USING (user_id = (select auth.uid()));

-- Receipts policies
DROP POLICY IF EXISTS "Users can manage own receipts" ON receipts;

CREATE POLICY "Users can manage own receipts" ON receipts
  FOR ALL USING (user_id = (select auth.uid()));

-- =====================================================================
-- MIGRATION 003: Functions and Triggers
-- =====================================================================

-- Function to calculate comprehensive user analytics
CREATE OR REPLACE FUNCTION calculate_user_analytics(p_user_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
    v_result JSONB;
BEGIN
    -- Calculate analytics for the specified period
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', v_start_date,
            'end_date', v_end_date
        ),
        'inventory', jsonb_build_object(
            'total_items', COUNT(DISTINCT i.id),
            'active_items', COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END),
            'total_value', COALESCE(SUM(i.retail_price * i.quantity_available), 0)
        ),
        'listings', jsonb_build_object(
            'total_listings', COUNT(DISTINCT l.id),
            'active_listings', COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END),
            'sold_listings', COUNT(DISTINCT CASE WHEN l.status = 'sold' THEN l.id END)
        ),
        'performance', jsonb_build_object(
            'total_revenue', COALESCE(SUM(CASE WHEN l.status = 'sold' THEN l.price END), 0),
            'avg_selling_price', COALESCE(AVG(CASE WHEN l.status = 'sold' THEN l.price END), 0),
            'items_sold', COUNT(DISTINCT CASE WHEN l.status = 'sold' THEN l.id END)
        ),
        'platforms', (
            SELECT COALESCE(jsonb_object_agg(platform, platform_stats), '{}'::jsonb)
            FROM (
                SELECT 
                    l.platform,
                    jsonb_build_object(
                        'total_listings', COUNT(*),
                        'active_listings', COUNT(CASE WHEN l.status = 'active' THEN 1 END),
                        'sold_listings', COUNT(CASE WHEN l.status = 'sold' THEN 1 END),
                        'revenue', COALESCE(SUM(CASE WHEN l.status = 'sold' THEN l.price END), 0)
                    ) as platform_stats
                FROM marketplace_listings l
                INNER JOIN inventory_items i ON l.inventory_item_id = i.id
                WHERE i.user_id = p_user_id
                    AND l.created_at::date BETWEEN v_start_date AND v_end_date
                GROUP BY l.platform
            ) platform_data
        ),
        'updated_at', NOW()
    ) INTO v_result
    FROM inventory_items i
    LEFT JOIN marketplace_listings l ON l.inventory_item_id = i.id 
        AND l.created_at::date BETWEEN v_start_date AND v_end_date
    WHERE i.user_id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory metrics
CREATE OR REPLACE FUNCTION get_inventory_metrics(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'total_items', COUNT(*),
            'active_items', COUNT(CASE WHEN status = 'active' THEN 1 END),
            'draft_items', COUNT(CASE WHEN status = 'draft' THEN 1 END),
            'sold_items', COUNT(CASE WHEN status = 'sold' THEN 1 END),
            'total_inventory_value', COALESCE(SUM(retail_price * quantity_available), 0),
            'average_item_value', COALESCE(AVG(retail_price), 0),
            'categories', (
                SELECT COALESCE(jsonb_object_agg(category, category_count), '{}'::jsonb)
                FROM (
                    SELECT category, COUNT(*) as category_count
                    FROM inventory_items 
                    WHERE user_id = p_user_id AND status != 'archived'
                    GROUP BY category
                ) cat_data
            ),
            'updated_at', NOW()
        )
        FROM inventory_items
        WHERE user_id = p_user_id AND status != 'archived'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify dead stock
CREATE OR REPLACE FUNCTION get_dead_stock(p_user_id UUID, p_days_threshold INTEGER DEFAULT 90)
RETURNS TABLE(
    item_id UUID,
    title VARCHAR(255),
    category VARCHAR(100),
    retail_price DECIMAL(10,2),
    quantity_available INTEGER,
    days_since_created INTEGER,
    total_listings INTEGER,
    active_listings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.category,
        i.retail_price,
        i.quantity_available,
        EXTRACT(DAY FROM NOW() - i.created_at)::INTEGER as days_since_created,
        COUNT(l.id)::INTEGER as total_listings,
        COUNT(CASE WHEN l.status = 'active' THEN 1 END)::INTEGER as active_listings
    FROM inventory_items i
    LEFT JOIN marketplace_listings l ON l.inventory_item_id = i.id
    WHERE i.user_id = p_user_id 
        AND i.status = 'active'
        AND i.created_at < NOW() - (p_days_threshold || ' days')::INTERVAL
        AND NOT EXISTS (
            SELECT 1 FROM marketplace_listings ml 
            WHERE ml.inventory_item_id = i.id AND ml.status = 'sold'
        )
    GROUP BY i.id, i.title, i.category, i.retail_price, i.quantity_available, i.created_at
    ORDER BY days_since_created DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync inventory across platforms
CREATE OR REPLACE FUNCTION sync_inventory_across_platforms(p_inventory_item_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_available_quantity INTEGER;
    v_updated_listings INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Get current available quantity
    SELECT quantity_available INTO v_available_quantity
    FROM inventory_items
    WHERE id = p_inventory_item_id;

    -- Update all active listings for this item
    UPDATE marketplace_listings
    SET 
        quantity = LEAST(quantity, v_available_quantity),
        status = CASE 
            WHEN v_available_quantity = 0 THEN 'out_of_stock'::listing_status
            ELSE status
        END,
        last_updated = NOW()
    WHERE inventory_item_id = p_inventory_item_id
        AND status IN ('active', 'out_of_stock');

    GET DIAGNOSTICS v_updated_listings = ROW_COUNT;

    -- Return sync results
    SELECT jsonb_build_object(
        'inventory_item_id', p_inventory_item_id,
        'available_quantity', v_available_quantity,
        'updated_listings', v_updated_listings,
        'synced_at', NOW()
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Database setup complete!
-- =====================================================================

-- Insert a test message to confirm setup
INSERT INTO users (email, password_hash, first_name, last_name) 
VALUES ('test@netpost.app', 'test_hash', 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

SELECT 'NetPost database setup complete! 🎉' as message;