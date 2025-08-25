"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        // Parse query parameters
        const { page = '1', limit = '20', search = '', category = '', status = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        // Build query
        let query = database_1.supabaseAdmin
            .from('inventory_items')
            .select(`
        *,
        marketplace_listings(*)
      `)
            .eq('user_id', user.id);
        // Apply filters
        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        if (category) {
            query = query.eq('category', category);
        }
        if (status) {
            query = query.eq('status', status);
        }
        // Apply sorting
        query = query.order(sortBy, {
            ascending: sortOrder === 'asc'
        });
        // Apply pagination
        query = query.range(offset, offset + parseInt(limit) - 1);
        const { data: items, error } = await query;
        if (error) {
            console.error('Database error:', error);
            throw new Error('Failed to fetch inventory items');
        }
        // Get total count for pagination
        const { count } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        res.status(200).json({
            success: true,
            data: {
                items: items || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / parseInt(limit))
                }
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
