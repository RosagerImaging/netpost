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
        const { requestId } = req.query;
        if (!requestId || typeof requestId !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: 'Request ID is required', code: 'MISSING_REQUEST_ID' }
            });
            return;
        }
        // Get cross-listing request details
        const { data: request, error } = await database_1.supabaseAdmin
            .from('crosslisting_requests')
            .select('*')
            .eq('id', requestId)
            .eq('user_id', user.id)
            .single();
        if (error || !request) {
            res.status(404).json({
                success: false,
                error: { message: 'Cross-listing request not found', code: 'REQUEST_NOT_FOUND' }
            });
            return;
        }
        // Calculate progress
        let progress = 0;
        if (request.status === 'completed') {
            progress = 100;
        }
        else if (request.status === 'in_progress') {
            progress = 50;
        }
        else if (request.status === 'failed') {
            progress = 0;
        }
        // Get associated marketplace listings if completed
        let listings = [];
        if (request.status === 'completed' && request.results) {
            const successfulResults = request.results.filter((r) => r.status === 'success');
            const listingIds = successfulResults.map((r) => r.listingId);
            if (listingIds.length > 0) {
                const { data: marketplaceListings } = await database_1.supabaseAdmin
                    .from('marketplace_listings')
                    .select(`
            *,
            inventory_items(title, sku)
          `)
                    .in('id', listingIds);
                listings = marketplaceListings || [];
            }
        }
        res.status(200).json({
            success: true,
            data: {
                request: {
                    id: request.id,
                    status: request.status,
                    sourcePlatform: request.source_platform,
                    targetPlatforms: request.target_platforms,
                    inventoryItems: request.inventory_items,
                    optimizeSEO: request.optimize_seo,
                    generateDescriptions: request.generate_descriptions,
                    createdAt: request.created_at,
                    completedAt: request.completed_at,
                    errorMessage: request.error_message,
                    results: request.results || [],
                    progress
                },
                listings
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
