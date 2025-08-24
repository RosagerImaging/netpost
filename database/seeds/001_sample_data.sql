-- Sample data for development and testing
-- Note: This should only be run in development environments

-- Create category mapping table
CREATE TABLE IF NOT EXISTS category_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_category VARCHAR(100) NOT NULL,
  target_category VARCHAR(200) NOT NULL,
  platform platform_enum NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_category, platform)
);

-- Sample categories for inventory categorization
INSERT INTO category_mappings (source_category, target_category, platform) VALUES
-- Fashion categories
('Clothing', 'Clothing, Shoes & Accessories', 'ebay'),
('Clothing', 'Women', 'poshmark'),
('Clothing', 'Clothing', 'mercari'),
('Shoes', 'Clothing, Shoes & Accessories', 'ebay'),
('Shoes', 'Shoes', 'poshmark'),
('Shoes', 'Shoes', 'mercari'),
('Bags', 'Clothing, Shoes & Accessories', 'ebay'),
('Bags', 'Bags', 'poshmark'),
('Bags', 'Bags', 'mercari'),

-- Electronics categories
('Electronics', 'Consumer Electronics', 'ebay'),
('Electronics', 'Electronics', 'mercari'),
('Phone Accessories', 'Cell Phones & Accessories', 'ebay'),
('Phone Accessories', 'Electronics', 'mercari'),

-- Home categories
('Home Decor', 'Home & Garden', 'ebay'),
('Home Decor', 'Home', 'mercari'),
('Kitchen', 'Home & Garden', 'ebay'),
('Kitchen', 'Home', 'mercari'),

-- Collectibles
('Collectibles', 'Collectibles', 'ebay'),
('Collectibles', 'Collectibles', 'mercari'),
('Toys', 'Toys & Hobbies', 'ebay'),
('Toys', 'Toys', 'mercari')
ON CONFLICT (source_category, platform) DO NOTHING;

-- Create sample platform configurations
CREATE TABLE IF NOT EXISTS platform_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform platform_enum NOT NULL,
  max_images INTEGER NOT NULL,
  max_title_length INTEGER NOT NULL,
  max_description_length INTEGER NOT NULL,
  supported_conditions TEXT[] NOT NULL,
  listing_fee DECIMAL(8,4) DEFAULT 0,
  final_value_fee_percentage DECIMAL(5,2) NOT NULL,
  payment_processing_fee DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_configurations (
  platform, max_images, max_title_length, max_description_length, 
  supported_conditions, listing_fee, final_value_fee_percentage, payment_processing_fee
) VALUES
('ebay', 24, 80, 500000, ARRAY['new', 'new_with_tags', 'new_without_tags', 'like_new', 'excellent', 'good', 'fair', 'poor'], 0, 13.25, 2.9),
('mercari', 20, 40, 1000, ARRAY['new', 'like_new', 'excellent', 'good', 'fair'], 0, 10.0, 2.9),
('poshmark', 16, 50, 500, ARRAY['new_with_tags', 'new_without_tags', 'like_new', 'excellent', 'good', 'fair'], 0, 20.0, 0),
('facebook_marketplace', 20, 100, 9999, ARRAY['new', 'like_new', 'excellent', 'good', 'fair'], 0, 5.0, 2.9),
('depop', 4, 65, 1000, ARRAY['new', 'like_new', 'excellent', 'good', 'fair'], 0, 10.0, 3.3),
('etsy', 13, 140, 13000, ARRAY['new', 'like_new', 'excellent', 'good'], 0.20, 6.5, 3.0);

-- Sample SEO keywords by category
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  keywords TEXT[] NOT NULL,
  platform platform_enum,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO seo_keywords (category, keywords, platform) VALUES
('fashion', ARRAY['vintage', 'designer', 'authentic', 'rare', 'limited', 'trendy', 'style', 'outfit', 'boutique', 'brand'], NULL),
('electronics', ARRAY['new', 'sealed', 'warranty', 'genuine', 'original', 'fast shipping', 'tested', 'working', 'unlocked'], NULL),
('collectibles', ARRAY['rare', 'vintage', 'authentic', 'mint', 'limited edition', 'collector', 'investment', 'original', 'antique'], NULL),
('home', ARRAY['home decor', 'interior design', 'functional', 'stylish', 'modern', 'classic', 'handmade', 'unique'], NULL),
('beauty', ARRAY['new', 'full size', 'authentic', 'sealed', 'fresh', 'professional', 'salon quality', 'brand new'], NULL);

-- Sample common size mappings
CREATE TABLE IF NOT EXISTS size_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  size_variations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO size_mappings (category, size_variations) VALUES
('clothing', '{
  "XS": ["XS", "Extra Small", "0", "2"],
  "S": ["S", "Small", "4", "6"],
  "M": ["M", "Medium", "8", "10"],
  "L": ["L", "Large", "12", "14"],
  "XL": ["XL", "Extra Large", "16", "18"],
  "XXL": ["XXL", "2X", "20", "22"]
}'),
('shoes', '{
  "5": ["5", "5.0", "35"],
  "6": ["6", "6.0", "36"],
  "7": ["7", "7.0", "37"],
  "8": ["8", "8.0", "38"],
  "9": ["9", "9.0", "39"],
  "10": ["10", "10.0", "40"],
  "11": ["11", "11.0", "41"]
}');

-- Sample automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- 'auto_delist', 'price_update', 'cross_list'
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default automation rules template
INSERT INTO automation_rules (user_id, rule_type, conditions, actions, is_active) 
SELECT 
  NULL, -- Will be copied for each user when they sign up
  'auto_delist',
  '{"trigger": "item_sold", "platforms": ["all"], "delay_minutes": 5}',
  '{"delist_from": "other_platforms", "update_inventory": true, "send_notification": true}',
  TRUE;

-- Create a view for common inventory queries
CREATE OR REPLACE VIEW inventory_with_listings AS
SELECT 
  ii.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ml.id,
        'platform', ml.platform,
        'status', ml.status,
        'price', ml.price,
        'platform_listing_id', ml.platform_listing_id,
        'platform_view_url', ml.platform_view_url,
        'listing_date', ml.listing_date
      )
    ) FILTER (WHERE ml.id IS NOT NULL),
    '[]'::jsonb
  ) AS marketplace_listings
FROM inventory_items ii
LEFT JOIN marketplace_listings ml ON ml.inventory_item_id = ii.id
GROUP BY ii.id;