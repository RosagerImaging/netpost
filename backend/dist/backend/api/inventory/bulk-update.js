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
    if (!(0, rateLimiting_1.strictRateLimit)(req, res))
        return;
    if (req.method !== 'PUT') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        const { items, operation } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            throw new errorHandler_1.ValidationError('Items array is required and cannot be empty');
        }
        if (items.length > 100) {
            throw new errorHandler_1.ValidationError('Cannot update more than 100 items at once');
        }
        if (!operation || !['update_status', 'update_prices', 'update_category'].includes(operation)) {
            throw new errorHandler_1.ValidationError('Invalid operation. Must be one of: update_status, update_prices, update_category');
        }
        let updatedItems = [];
        switch (operation) {
            case 'update_status':
                updatedItems = await bulkUpdateStatus(user.id, items);
                break;
            case 'update_prices':
                updatedItems = await bulkUpdatePrices(user.id, items);
                break;
            case 'update_category':
                updatedItems = await bulkUpdateCategory(user.id, items);
                break;
        }
        res.status(200).json({
            success: true,
            data: {
                updatedCount: updatedItems.length,
                items: updatedItems
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
async function bulkUpdateStatus(userId, items) {
    const { newStatus } = items[0]; // Assuming all items get the same status
    const itemIds = items.map(item => item.id);
    if (!newStatus || !['active', 'draft', 'archived'].includes(newStatus)) {
        throw new errorHandler_1.ValidationError('Invalid status');
    }
    // Verify all items belong to the user
    const { data: userItems, error: fetchError } = await database_1.supabaseAdmin
        .from('inventory_items')
        .select('id')
        .eq('user_id', userId)
        .in('id', itemIds);
    if (fetchError || !userItems || userItems.length !== itemIds.length) {
        throw new errorHandler_1.ValidationError('Some items not found or not accessible');
    }
    // Update items
    const { data: updatedItems, error: updateError } = await database_1.supabaseAdmin
        .from('inventory_items')
        .update({ status: newStatus })
        .eq('user_id', userId)
        .in('id', itemIds)
        .select('*');
    if (updateError) {
        throw new Error('Failed to update item statuses');
    }
    return updatedItems || [];
}
async function bulkUpdatePrices(userId, items) {
    const updatedItems = [];
    for (const item of items) {
        if (!item.id || !item.retailPrice || item.retailPrice <= 0) {
            continue; // Skip invalid items
        }
        try {
            const { data: updatedItem, error } = await database_1.supabaseAdmin
                .from('inventory_items')
                .update({
                retail_price: parseFloat(item.retailPrice),
                cost_basis: item.costBasis ? parseFloat(item.costBasis) : undefined
            })
                .eq('id', item.id)
                .eq('user_id', userId)
                .select('*')
                .single();
            if (!error && updatedItem) {
                updatedItems.push(updatedItem);
            }
        }
        catch (error) {
            console.error(`Failed to update item ${item.id}:`, error);
            // Continue with other items
        }
    }
    return updatedItems;
}
async function bulkUpdateCategory(userId, items) {
    const { newCategory } = items[0]; // Assuming all items get the same category
    const itemIds = items.map(item => item.id);
    if (!newCategory || newCategory.trim().length === 0) {
        throw new errorHandler_1.ValidationError('Invalid category');
    }
    // Verify all items belong to the user
    const { data: userItems, error: fetchError } = await database_1.supabaseAdmin
        .from('inventory_items')
        .select('id')
        .eq('user_id', userId)
        .in('id', itemIds);
    if (fetchError || !userItems || userItems.length !== itemIds.length) {
        throw new errorHandler_1.ValidationError('Some items not found or not accessible');
    }
    // Update items
    const { data: updatedItems, error: updateError } = await database_1.supabaseAdmin
        .from('inventory_items')
        .update({ category: newCategory.trim() })
        .eq('user_id', userId)
        .in('id', itemIds)
        .select('*');
    if (updateError) {
        throw new Error('Failed to update item categories');
    }
    return updatedItems || [];
}
