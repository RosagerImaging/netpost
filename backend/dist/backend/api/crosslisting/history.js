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
        // Parse query parameters
        const { page = '1', limit = '20', status = '', platform = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        // Build query
        let query = database_1.supabaseAdmin
            .from('crosslisting_requests')
            .select('*')
            .eq('user_id', user.id);
        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        if (platform) {
            query = query.contains('target_platforms', [platform]);
        }
        // Apply sorting
        query = query.order(sortBy, {
            ascending: sortOrder === 'asc'
        });
        // Apply pagination
        query = query.range(offset, offset + parseInt(limit) - 1);
        const { data: requests, error } = await query;
        if (error) {
            console.error('Database error:', error);
            throw new Error('Failed to fetch cross-listing history');
        }
        // Get total count for pagination
        const { count: totalCount } = await database_1.supabaseAdmin
            .from('crosslisting_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        // Calculate statistics
        const { data: stats } = await database_1.supabaseAdmin
            .from('crosslisting_requests')
            .select('status')
            .eq('user_id', user.id);
        const statistics = {
            total: stats?.length || 0,
            completed: stats?.filter(r => r.status === 'completed').length || 0,
            failed: stats?.filter(r => r.status === 'failed').length || 0,
            pending: stats?.filter(r => r.status === 'pending').length || 0,
            inProgress: stats?.filter(r => r.status === 'in_progress').length || 0
        };
        // Get monthly usage
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const { count: monthlyCount } = await database_1.supabaseAdmin
            .from('crosslisting_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', currentMonth.toISOString());
        res.status(200).json({
            success: true,
            data: {
                requests: requests || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount || 0,
                    totalPages: Math.ceil((totalCount || 0) / parseInt(limit))
                },
                statistics,
                monthlyUsage: monthlyCount || 0
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
