-- Migration 005: Fix Function Search Path Security Vulnerabilities
-- Date: 2025-08-25
-- Security Fix: Add search_path = '' to prevent search path injection attacks
-- 
-- This migration addresses the following security vulnerability:
-- Functions without proper search_path settings are vulnerable to search_path injection attacks.
-- Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--
-- Functions being secured:
-- 1. public.update_updated_at_column
-- 2. public.calculate_user_analytics  
-- 3. public.get_inventory_metrics
-- 4. public.get_dead_stock
-- 5. public.sync_inventory_across_platforms

-- Fix 1: update_updated_at_column - Add search_path security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Fix 2: calculate_user_analytics - Add search_path security and schema qualifiers
CREATE OR REPLACE FUNCTION public.calculate_user_analytics(p_user_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
                FROM public.marketplace_listings l
                INNER JOIN public.inventory_items i ON l.inventory_item_id = i.id
                WHERE i.user_id = p_user_id
                    AND l.created_at::date BETWEEN v_start_date AND v_end_date
                GROUP BY l.platform
            ) platform_data
        ),
        'updated_at', NOW()
    ) INTO v_result
    FROM public.inventory_items i
    LEFT JOIN public.marketplace_listings l ON l.inventory_item_id = i.id 
        AND l.created_at::date BETWEEN v_start_date AND v_end_date
    WHERE i.user_id = p_user_id;

    RETURN v_result;
END;
$function$;

-- Fix 3: get_inventory_metrics - Add search_path security and schema qualifiers
CREATE OR REPLACE FUNCTION public.get_inventory_metrics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
                    FROM public.inventory_items 
                    WHERE user_id = p_user_id AND status != 'archived'
                    GROUP BY category
                ) cat_data
            ),
            'updated_at', NOW()
        )
        FROM public.inventory_items
        WHERE user_id = p_user_id AND status != 'archived'
    );
END;
$function$;

-- Fix 4: get_dead_stock - Add search_path security and schema qualifiers
CREATE OR REPLACE FUNCTION public.get_dead_stock(p_user_id uuid, p_days_threshold integer DEFAULT 90)
 RETURNS TABLE(item_id uuid, title character varying, category character varying, retail_price numeric, quantity_available integer, days_since_created integer, total_listings integer, active_listings integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
    FROM public.inventory_items i
    LEFT JOIN public.marketplace_listings l ON l.inventory_item_id = i.id
    WHERE i.user_id = p_user_id 
        AND i.status = 'active'
        AND i.created_at < NOW() - (p_days_threshold || ' days')::INTERVAL
        AND NOT EXISTS (
            SELECT 1 FROM public.marketplace_listings ml 
            WHERE ml.inventory_item_id = i.id AND ml.status = 'sold'
        )
    GROUP BY i.id, i.title, i.category, i.retail_price, i.quantity_available, i.created_at
    ORDER BY days_since_created DESC;
END;
$function$;

-- Fix 5: sync_inventory_across_platforms - Add search_path security and schema qualifiers
CREATE OR REPLACE FUNCTION public.sync_inventory_across_platforms(p_inventory_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_available_quantity INTEGER;
    v_updated_listings INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Get current available quantity
    SELECT quantity_available INTO v_available_quantity
    FROM public.inventory_items
    WHERE id = p_inventory_item_id;

    -- Update all active listings for this item
    UPDATE public.marketplace_listings
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
$function$;

-- Migration completed: All 5 functions now have secure search_path settings
-- This prevents search_path injection attacks by forcing all object references 
-- to be schema-qualified when search_path is set to an empty string.