"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const securityEnhancements_1 = require("../../src/middleware/securityEnhancements");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, securityEnhancements_1.validateInput)(req, res))
        return;
    if (!(0, rateLimiting_1.apiRateLimit)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        const { title, description, images, sku, barcode, costBasis, retailPrice, quantityTotal, quantityAvailable, category, brand, condition, size, color, material, weight, dimensions } = req.body;
        // Enhanced input validation
        if (!title || !description || !images || !sku || !category || !condition) {
            throw new errorHandler_1.ValidationError('Missing required fields: title, description, images, sku, category, condition');
        }
        // Validate input lengths and formats
        if (title.length > 255 || title.length < 3) {
            throw new errorHandler_1.ValidationError('Title must be between 3 and 255 characters');
        }
        if (description.length > 5000 || description.length < 10) {
            throw new errorHandler_1.ValidationError('Description must be between 10 and 5000 characters');
        }
        if (!/^[A-Za-z0-9-_]+$/.test(sku)) {
            throw new errorHandler_1.ValidationError('SKU must contain only alphanumeric characters, hyphens, and underscores');
        }
        if (category.length > 100) {
            throw new errorHandler_1.ValidationError('Category must be less than 100 characters');
        }
        if (!Array.isArray(images) || images.length === 0) {
            throw new errorHandler_1.ValidationError('At least one image is required');
        }
        // Enhanced numeric validation
        const parsedCostBasis = parseFloat(costBasis) || 0;
        const parsedRetailPrice = parseFloat(retailPrice);
        if (parsedCostBasis < 0 || parsedCostBasis > 999999.99) {
            throw new errorHandler_1.ValidationError('Cost basis must be between 0 and 999,999.99');
        }
        if (parsedRetailPrice <= 0 || parsedRetailPrice > 999999.99) {
            throw new errorHandler_1.ValidationError('Retail price must be between 0.01 and 999,999.99');
        }
        if (quantityTotal <= 0 || quantityAvailable < 0 || quantityAvailable > quantityTotal) {
            throw new errorHandler_1.ValidationError('Invalid quantity values');
        }
        // Check if SKU already exists for this user
        const { data: existingSku } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('sku', sku)
            .single();
        if (existingSku) {
            throw new errorHandler_1.ValidationError('SKU already exists for this user');
        }
        // Create inventory item
        const { data: newItem, error: createError } = await database_1.supabaseAdmin
            .from('inventory_items')
            .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            images,
            sku: sku.trim(),
            barcode: barcode?.trim() || null,
            cost_basis: parsedCostBasis,
            retail_price: parsedRetailPrice,
            quantity_total: parseInt(quantityTotal),
            quantity_available: parseInt(quantityAvailable),
            category: category.trim(),
            brand: brand?.trim() || null,
            condition,
            size: size?.trim() || null,
            color: color?.trim() || null,
            material: material?.trim() || null,
            weight: weight ? parseFloat(weight) : null,
            dimensions: dimensions || null,
            status: 'draft'
        })
            .select(`
        *,
        marketplace_listings(*)
      `)
            .single();
        if (createError) {
            console.error('Database error:', createError);
            throw new Error('Failed to create inventory item');
        }
        res.status(201).json({
            success: true,
            data: {
                item: newItem
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
