"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, rateLimiting_1.apiRateLimit)(req, res))
        return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        // Get basic inventory metrics
        const { data: metricsData, error: metricsError } = await database_1.supabaseAdmin
            .rpc('get_inventory_metrics', { p_user_id: user.id });
        if (metricsError) {
            console.error('Failed to get inventory metrics:', metricsError);
            throw new Error('Failed to fetch inventory metrics');
        }
        // Get dead stock items (items listed for more than 30 days)
        const { data: deadStockData, error: deadStockError } = await database_1.supabaseAdmin
            .rpc('get_dead_stock', { p_user_id: user.id, p_days: 30 });
        if (deadStockError) {
            console.error('Failed to get dead stock:', deadStockError);
            // Don't fail the entire request, just set empty array
        }
        // Get category breakdown
        const { data: categoryBreakdown, error: categoryError } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('category, status')
            .eq('user_id', user.id);
        if (categoryError) {
            console.error('Failed to get category breakdown:', categoryError);
        }
        // Process category data
        const categoryStats = categoryBreakdown?.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = {
                    total: 0,
                    active: 0,
                    sold: 0,
                    draft: 0
                };
            }
            acc[item.category].total++;
            acc[item.category][item.status]++;
            return acc;
        }, {}) || {};
        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: recentActivity, error: activityError } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('created_at, updated_at, title, status')
            .eq('user_id', user.id)
            .or(`created_at.gte.${sevenDaysAgo.toISOString()},updated_at.gte.${sevenDaysAgo.toISOString()}`)
            .order('updated_at', { ascending: false })
            .limit(10);
        if (activityError) {
            console.error('Failed to get recent activity:', activityError);
        }
        // Get platform performance
        const { data: platformPerformance, error: platformError } = await database_1.supabaseAdmin
            .from('marketplace_listings')
            .select(`
        platform,
        status,
        price,
        inventory_items!inner(user_id)
      `)
            .eq('inventory_items.user_id', user.id);
        if (platformError) {
            console.error('Failed to get platform performance:', platformError);
        }
        // Process platform data
        const platformStats = platformPerformance?.reduce((acc, listing) => {
            if (!acc[listing.platform]) {
                acc[listing.platform] = {
                    total: 0,
                    active: 0,
                    sold: 0,
                    totalValue: 0,
                    avgPrice: 0
                };
            }
            acc[listing.platform].total++;
            acc[listing.platform][listing.status]++;
            acc[listing.platform].totalValue += listing.price || 0;
            return acc;
        }, {}) || {};
        // Calculate average prices
        Object.keys(platformStats).forEach(platform => {
            if (platformStats[platform].total > 0) {
                platformStats[platform].avgPrice = platformStats[platform].totalValue / platformStats[platform].total;
            }
        });
        res.status(200).json({
            success: true,
            data: {
                overview: metricsData || {
                    total_items: 0,
                    active_listings: 0,
                    sold_items: 0,
                    draft_items: 0,
                    total_value: 0,
                    average_cost_basis: 0
                },
                deadStock: deadStockData || [],
                categoryBreakdown: categoryStats,
                recentActivity: recentActivity || [],
                platformPerformance: platformStats
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
