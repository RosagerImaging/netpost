-- =====================================================================
-- RLS Performance Optimization for NetPost
-- =====================================================================
-- Apply this in Supabase SQL Editor to fix performance issues
-- Go to: https://supabase.com/dashboard/project/_/sql
--
-- PROBLEM: Performance advisor identified RLS policies with inefficient 
-- auth function calls that re-evaluate for each row on these tables:
-- - users, user_preferences, platform_credentials, inventory_items
-- - marketplace_listings, crosslisting_requests, seo_analyses
-- - sales_analytics, tax_documents, receipts
--
-- SOLUTION: Replace auth.uid() with (select auth.uid()) to prevent 
-- re-evaluation per row and improve query performance at scale.
-- =====================================================================

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own platform credentials" ON platform_credentials;
DROP POLICY IF EXISTS "Users can manage own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can manage own marketplace listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can manage own crosslisting requests" ON crosslisting_requests;
DROP POLICY IF EXISTS "Users can manage own SEO analyses" ON seo_analyses;
DROP POLICY IF EXISTS "Users can view own sales analytics" ON sales_analytics;
DROP POLICY IF EXISTS "Users can manage own tax documents" ON tax_documents;
DROP POLICY IF EXISTS "Users can manage own receipts" ON receipts;

-- Create optimized policies with (select auth.uid()) instead of auth.uid()
-- This ensures the auth function is evaluated once per query, not once per row

CREATE POLICY "Users can view own profile" ON users
    FOR ALL USING (id = (select auth.uid()));

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own platform credentials" ON platform_credentials
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own inventory items" ON inventory_items
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own marketplace listings" ON marketplace_listings
    FOR ALL USING (
        inventory_item_id IN (
            SELECT inventory_items.id
            FROM inventory_items
            WHERE inventory_items.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can manage own crosslisting requests" ON crosslisting_requests
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own SEO analyses" ON seo_analyses
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own sales analytics" ON sales_analytics
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own tax documents" ON tax_documents
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own receipts" ON receipts
    FOR ALL USING (user_id = (select auth.uid()));

-- =====================================================================
-- Performance optimization complete! 
-- Run the performance advisor again to verify the fixes.
-- =====================================================================

SELECT 'RLS Performance Optimization Applied Successfully! 🚀' as result;