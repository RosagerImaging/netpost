-- Performance and Security Enhancement Indexes
-- Run these concurrently in production to avoid downtime

-- Enhanced indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE subscription_status != 'canceled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_active
ON users(subscription_tier, subscription_status, trial_end_date)
WHERE subscription_status IN ('active', 'trialing', 'past_due');

-- Inventory performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_user_status_active
ON inventory_items(user_id, status, updated_at)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_category_condition
ON inventory_items(category, condition, status)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_sku_lookup
ON inventory_items(user_id, sku)
INCLUDE (id, title, status);

-- Marketplace listings performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_performance_active
ON marketplace_listings(inventory_item_id, platform, status, listing_date)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_platform_status
ON marketplace_listings(platform, status, last_updated)
WHERE status IN ('active', 'sold');

-- Cross-listing request optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crosslisting_user_status_date
ON crosslisting_requests(user_id, status, created_at)
WHERE status IN ('pending', 'in_progress');

-- SEO analyses lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_user_platform_date
ON seo_analyses(user_id, platform, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_inventory_latest
ON seo_analyses(inventory_item_id, created_at DESC);

-- Sales analytics aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_user_period
ON sales_analytics(user_id, period_start, period_end);

-- Platform credentials security
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credentials_user_active
ON platform_credentials(user_id, platform, is_active)
WHERE is_active = true;

-- Tax and receipt organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_user_date_category
ON receipts(user_id, date DESC, category)
WHERE is_deductible = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tax_docs_user_year
ON tax_documents(user_id, year DESC, document_type);

-- Audit trail indexes (for future security logging)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_action_time
-- ON audit_logs(user_id, action, created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_full_text_search
ON inventory_items USING gin(to_tsvector('english', title || ' ' || description))
WHERE status = 'active';

-- Statistics for query planner
ANALYZE users;
ANALYZE inventory_items;
ANALYZE marketplace_listings;
ANALYZE crosslisting_requests;
ANALYZE seo_analyses;
ANALYZE sales_analytics;

-- Create partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_recent_active
ON inventory_items(user_id, created_at DESC)
WHERE status = 'active' AND created_at > NOW() - INTERVAL '30 days';

-- Index for monitoring slow queries and performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login
ON users(last_login_at DESC NULLS LAST)
WHERE subscription_status = 'active';

-- Comments for documentation
COMMENT ON INDEX idx_users_email_active IS 'Optimized lookup for active user authentication';
COMMENT ON INDEX idx_inventory_user_status_active IS 'Primary index for user inventory queries';
COMMENT ON INDEX idx_listings_performance_active IS 'Optimized for marketplace listing performance queries';
COMMENT ON INDEX idx_crosslisting_user_status_date IS 'Supports crosslisting status tracking';
COMMENT ON INDEX idx_inventory_full_text_search IS 'Full-text search on inventory items';