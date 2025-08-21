-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types and enums
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

CREATE TYPE platform_enum AS ENUM (
  'ebay',
  'mercari',
  'poshmark',
  'facebook_marketplace',
  'depop',
  'etsy'
);

CREATE TYPE listing_status AS ENUM (
  'active',
  'sold',
  'ended',
  'draft',
  'suspended',
  'out_of_stock'
);

CREATE TYPE inventory_status AS ENUM (
  'active',
  'sold',
  'grayed_out',
  'draft',
  'archived'
);

CREATE TYPE subscription_tier AS ENUM (
  'trial',
  'starter',
  'professional',
  'enterprise'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'canceled',
  'trialing',
  'incomplete'
);

CREATE TYPE crosslisting_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
);

-- Users table
CREATE TABLE users (
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
CREATE TABLE user_preferences (
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
CREATE TABLE platform_credentials (
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
CREATE TABLE inventory_items (
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
CREATE TABLE marketplace_listings (
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
CREATE TABLE crosslisting_requests (
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
CREATE TABLE seo_analyses (
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
CREATE TABLE sales_analytics (
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
CREATE TABLE tax_documents (
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
CREATE TABLE receipts (
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_sku ON inventory_items(user_id, sku);
CREATE INDEX idx_marketplace_listings_inventory_item_id ON marketplace_listings(inventory_item_id);
CREATE INDEX idx_marketplace_listings_platform ON marketplace_listings(platform);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_crosslisting_requests_user_id ON crosslisting_requests(user_id);
CREATE INDEX idx_crosslisting_requests_status ON crosslisting_requests(status);
CREATE INDEX idx_seo_analyses_user_id ON seo_analyses(user_id);
CREATE INDEX idx_seo_analyses_inventory_item_id ON seo_analyses(inventory_item_id);
CREATE INDEX idx_sales_analytics_user_id ON sales_analytics(user_id);
CREATE INDEX idx_tax_documents_user_id ON tax_documents(user_id);
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(user_id, date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();