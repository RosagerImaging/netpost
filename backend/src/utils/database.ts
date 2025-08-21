import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Service role client for admin operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for user operations
export const createSupabaseClient = (accessToken?: string) => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      }
    }
  );
};

export interface DatabaseTables {
  users: any;
  inventory_items: any;
  marketplace_listings: any;
  crosslisting_requests: any;
  platform_credentials: any;
  user_preferences: any;
  seo_analyses: any;
  sales_analytics: any;
}