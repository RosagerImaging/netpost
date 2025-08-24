"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.createSupabaseClient = exports.supabaseAdmin = void 0;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.createUser = createUser;
exports.updateUser = updateUser;
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
// Service role client for admin operations
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});
// Regular client for user operations
const createSupabaseClient = (accessToken) => {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        },
        global: {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        },
        db: {
            schema: 'public'
        }
    });
};
exports.createSupabaseClient = createSupabaseClient;
// Client-side Supabase client
exports.supabase = (0, exports.createSupabaseClient)();
// Helper functions for database operations
async function getUserById(id) {
    const { data, error } = await exports.supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error)
        throw error;
    return data;
}
async function getUserByEmail(email) {
    const { data, error } = await exports.supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error; // PGRST116 = not found
    return data;
}
async function createUser(userData) {
    const { data, error } = await exports.supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function updateUser(id, updates) {
    const { data, error } = await exports.supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
