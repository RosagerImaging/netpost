export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare const createSupabaseClient: (accessToken?: string) => import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface DatabaseTables {
    users: {
        Row: {
            id: string;
            email: string;
            password_hash: string;
            first_name: string | null;
            last_name: string | null;
            subscription_tier: 'trial' | 'starter' | 'professional' | 'enterprise';
            subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
            stripe_customer_id: string | null;
            trial_end_date: string | null;
            subscription_end_date: string | null;
            last_login_at: string | null;
            created_at: string;
            updated_at: string;
        };
        Insert: {
            id?: string;
            email: string;
            password_hash: string;
            first_name?: string | null;
            last_name?: string | null;
            subscription_tier?: 'trial' | 'starter' | 'professional' | 'enterprise';
            subscription_status?: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
            stripe_customer_id?: string | null;
            trial_end_date?: string | null;
            subscription_end_date?: string | null;
            last_login_at?: string | null;
        };
        Update: Partial<DatabaseTables['users']['Insert']>;
    };
    inventory_items: {
        Row: {
            id: string;
            user_id: string;
            title: string;
            description: string;
            images: string[];
            sku: string;
            barcode: string | null;
            cost_basis: number;
            retail_price: number;
            quantity_total: number;
            quantity_available: number;
            category: string;
            brand: string | null;
            condition: 'new' | 'new_with_tags' | 'new_without_tags' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
            size: string | null;
            color: string | null;
            material: string | null;
            weight: number | null;
            dimensions: any | null;
            listing_group_id: string | null;
            status: 'active' | 'sold' | 'grayed_out' | 'draft' | 'archived';
            created_at: string;
            updated_at: string;
        };
        Insert: Omit<DatabaseTables['inventory_items']['Row'], 'id' | 'created_at' | 'updated_at'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['inventory_items']['Insert']>;
    };
    marketplace_listings: {
        Row: {
            id: string;
            inventory_item_id: string;
            platform: 'ebay' | 'mercari' | 'poshmark' | 'facebook_marketplace' | 'depop' | 'etsy';
            platform_listing_id: string;
            platform_edit_url: string | null;
            platform_view_url: string | null;
            status: 'active' | 'sold' | 'ended' | 'draft' | 'suspended' | 'out_of_stock';
            quantity: number;
            price: number;
            listing_date: string | null;
            last_updated: string;
            performance_metrics: any;
            created_at: string;
        };
        Insert: Omit<DatabaseTables['marketplace_listings']['Row'], 'id' | 'created_at' | 'last_updated'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['marketplace_listings']['Insert']>;
    };
    user_preferences: {
        Row: {
            id: string;
            user_id: string;
            dark_mode: boolean;
            auto_optimize_seo: boolean;
            enable_auto_delisting: boolean;
            default_listing_duration: number;
            email_notifications: boolean;
            price_optimization_enabled: boolean;
            ai_description_enabled: boolean;
            updated_at: string;
        };
        Insert: Omit<DatabaseTables['user_preferences']['Row'], 'id' | 'updated_at'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['user_preferences']['Insert']>;
    };
    platform_credentials: {
        Row: {
            id: string;
            user_id: string;
            platform: 'ebay' | 'mercari' | 'poshmark' | 'facebook_marketplace' | 'depop' | 'etsy';
            encrypted_credentials: string;
            is_active: boolean;
            last_verified: string | null;
            created_at: string;
        };
        Insert: Omit<DatabaseTables['platform_credentials']['Row'], 'id' | 'created_at'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['platform_credentials']['Insert']>;
    };
    crosslisting_requests: {
        Row: {
            id: string;
            user_id: string;
            source_platform: 'ebay' | 'mercari' | 'poshmark' | 'facebook_marketplace' | 'depop' | 'etsy';
            target_platforms: ('ebay' | 'mercari' | 'poshmark' | 'facebook_marketplace' | 'depop' | 'etsy')[];
            inventory_items: string[];
            status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
            optimize_seo: boolean;
            generate_descriptions: boolean;
            results: any;
            error_message: string | null;
            created_at: string;
            completed_at: string | null;
        };
        Insert: Omit<DatabaseTables['crosslisting_requests']['Row'], 'id' | 'created_at'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['crosslisting_requests']['Insert']>;
    };
    seo_analyses: {
        Row: {
            id: string;
            user_id: string;
            inventory_item_id: string;
            platform: 'ebay' | 'mercari' | 'poshmark' | 'facebook_marketplace' | 'depop' | 'etsy';
            score: number;
            recommendations: any;
            keyword_suggestions: string[];
            competitor_analysis: any | null;
            overall_assessment: string | null;
            created_at: string;
        };
        Insert: Omit<DatabaseTables['seo_analyses']['Row'], 'id' | 'created_at'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['seo_analyses']['Insert']>;
    };
    sales_analytics: {
        Row: {
            id: string;
            user_id: string;
            period_start: string;
            period_end: string;
            total_revenue: number;
            total_profit: number;
            total_costs: number;
            items_sold: number;
            average_selling_price: number;
            average_days_to_sell: number;
            platform_breakdown: any;
            category_breakdown: any;
            created_at: string;
        };
        Insert: Omit<DatabaseTables['sales_analytics']['Row'], 'id' | 'created_at'> & {
            id?: string;
        };
        Update: Partial<DatabaseTables['sales_analytics']['Insert']>;
    };
}
export declare function getUserById(id: string): Promise<any>;
export declare function getUserByEmail(email: string): Promise<any>;
export declare function createUser(userData: DatabaseTables['users']['Insert']): Promise<any>;
export declare function updateUser(id: string, updates: DatabaseTables['users']['Update']): Promise<any>;
