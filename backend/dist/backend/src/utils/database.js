"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.createSupabaseClient = exports.supabaseAdmin = void 0;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.getInventoryItemsByUser = getInventoryItemsByUser;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.getQueryMetrics = getQueryMetrics;
exports.clearQueryMetrics = clearQueryMetrics;
const supabase_js_1 = require("@supabase/supabase-js");
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
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
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
});
// Regular client for user operations with optimizations
const createSupabaseClient = (accessToken) => {
    const headers = {
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100'
    };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
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
    });
};
exports.createSupabaseClient = createSupabaseClient;
// Client-side Supabase client
exports.supabase = (0, exports.createSupabaseClient)();
const queryMetrics = [];
function logSlowQuery(query, duration) {
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
async function getUserById(id) {
    const startTime = performance.now();
    const { data, error } = await exports.supabaseAdmin
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
    if (error)
        throw error;
    return data;
}
async function getUserByEmail(email) {
    const startTime = performance.now();
    const { data, error } = await exports.supabaseAdmin
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
    if (error && error.code !== 'PGRST116')
        throw error; // PGRST116 = not found
    return data;
}
async function createUser(userData) {
    const startTime = performance.now();
    const { data, error } = await exports.supabaseAdmin
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
    if (error)
        throw error;
    return data;
}
async function updateUser(id, updates) {
    const startTime = performance.now();
    const { data, error } = await exports.supabaseAdmin
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
    if (error)
        throw error;
    return data;
}
// Bulk operations for better performance
async function getInventoryItemsByUser(userId, limit = 50, offset = 0) {
    const startTime = performance.now();
    const { data, error, count } = await exports.supabaseAdmin
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
    if (error)
        throw error;
    return { items: data, total: count };
}
// Connection health check
async function checkDatabaseHealth() {
    try {
        const startTime = performance.now();
        const { error } = await exports.supabaseAdmin
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
    }
    catch (error) {
        console.error('Database health check error:', error);
        return false;
    }
}
// Get query performance metrics
function getQueryMetrics() {
    return [...queryMetrics];
}
// Clear query metrics
function clearQueryMetrics() {
    queryMetrics.length = 0;
}
