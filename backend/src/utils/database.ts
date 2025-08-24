import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Service role client for admin operations with optimized configuration
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Regular client for user operations with optimizations
export const createSupabaseClient = (accessToken?: string) => {
  const headers: Record<string, string> = {
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100'
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      global: {
        headers
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );
};

// Client-side Supabase client
export const supabase = createSupabaseClient();

// Database type definitions matching our schema
// Optimized database indexes (for reference - should be in migrations)
// CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email) WHERE subscription_status != 'canceled';
// CREATE INDEX CONCURRENTLY idx_inventory_user_status ON inventory_items(user_id, status) WHERE status = 'active';
// CREATE INDEX CONCURRENTLY idx_listings_performance ON marketplace_listings(inventory_item_id, platform, status);
// CREATE INDEX CONCURRENTLY idx_crosslisting_user_status ON crosslisting_requests(user_id, status, created_at);

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

// Query performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
}

const queryMetrics: QueryMetrics[] = [];

function logSlowQuery(query: string, duration: number) {
  if (duration > 1000) { // Log queries taking more than 1 second
    console.warn(`Slow query detected (${duration}ms):`, query);
    queryMetrics.push({
      query,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 slow queries
    if (queryMetrics.length > 100) {
      queryMetrics.shift();
    }
  }
}

// Optimized helper functions for database operations
export async function getUserById(id: string) {
  const startTime = performance.now();
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      subscription_tier,
      subscription_status,
      stripe_customer_id,
      trial_end_date,
      subscription_end_date,
      last_login_at,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();
    
  const duration = performance.now() - startTime;
  logSlowQuery(`getUserById(${id})`, duration);
  
  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const startTime = performance.now();
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      password_hash,
      first_name,
      last_name,
      subscription_tier,
      subscription_status,
      stripe_customer_id,
      trial_end_date,
      subscription_end_date,
      last_login_at,
      created_at,
      updated_at
    `)
    .eq('email', email)
    .single();
    
  const duration = performance.now() - startTime;
  logSlowQuery(`getUserByEmail(${email})`, duration);
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function createUser(userData: DatabaseTables['users']['Insert']) {
  const startTime = performance.now();
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(userData)
    .select(`
      id,
      email,
      first_name,
      last_name,
      subscription_tier,
      subscription_status,
      trial_end_date,
      subscription_end_date,
      created_at,
      updated_at
    `)
    .single();
    
  const duration = performance.now() - startTime;
  logSlowQuery(`createUser(${userData.email})`, duration);
    
  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: DatabaseTables['users']['Update']) {
  const startTime = performance.now();
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      id,
      email,
      first_name,
      last_name,
      subscription_tier,
      subscription_status,
      trial_end_date,
      subscription_end_date,
      updated_at
    `)
    .single();
    
  const duration = performance.now() - startTime;
  logSlowQuery(`updateUser(${id})`, duration);
    
  if (error) throw error;
  return data;
}

// Bulk operations for better performance
export async function getInventoryItemsByUser(userId: string, limit = 50, offset = 0) {
  const startTime = performance.now();
  
  const { data, error, count } = await supabaseAdmin
    .from('inventory_items')
    .select(`
      id,
      title,
      description,
      images,
      sku,
      retail_price,
      quantity_available,
      category,
      condition,
      status,
      created_at,
      marketplace_listings!inner(
        id,
        platform,
        status,
        price,
        listing_date
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  const duration = performance.now() - startTime;
  logSlowQuery(`getInventoryItemsByUser(${userId}, ${limit}, ${offset})`, duration);
    
  if (error) throw error;
  return { items: data, total: count };
}

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const startTime = performance.now();
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    const duration = performance.now() - startTime;
    
    if (error) {
      console.error('Database health check failed:', error);
      return false;
    }
    
    if (duration > 5000) { // 5 seconds
      console.warn(`Database response time is slow: ${duration}ms`);
    }
    
    return true;
  } catch (error) {
    console.error('Database health check error:', error);
    return false;
  }
}

// Get query performance metrics
export function getQueryMetrics(): QueryMetrics[] {
  return [...queryMetrics];
}

// Clear query metrics
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}