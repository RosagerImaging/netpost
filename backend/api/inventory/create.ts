import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { apiRateLimit } from '../../src/middleware/rateLimiting';
import { validateInput } from '../../src/middleware/securityEnhancements';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!validateInput(req, res)) return;
  if (!apiRateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);
    
    const {
      title,
      description,
      images,
      sku,
      barcode,
      costBasis,
      retailPrice,
      quantityTotal,
      quantityAvailable,
      category,
      brand,
      condition,
      size,
      color,
      material,
      weight,
      dimensions
    } = req.body;

    // Enhanced input validation
    if (!title || !description || !images || !sku || !category || !condition) {
      throw new ValidationError('Missing required fields: title, description, images, sku, category, condition');
    }

    // Validate input lengths and formats
    if (title.length > 255 || title.length < 3) {
      throw new ValidationError('Title must be between 3 and 255 characters');
    }

    if (description.length > 5000 || description.length < 10) {
      throw new ValidationError('Description must be between 10 and 5000 characters');
    }

    if (!/^[A-Za-z0-9-_]+$/.test(sku)) {
      throw new ValidationError('SKU must contain only alphanumeric characters, hyphens, and underscores');
    }

    if (category.length > 100) {
      throw new ValidationError('Category must be less than 100 characters');
    }

    if (!Array.isArray(images) || images.length === 0) {
      throw new ValidationError('At least one image is required');
    }

    // Enhanced numeric validation
    const parsedCostBasis = parseFloat(costBasis) || 0;
    const parsedRetailPrice = parseFloat(retailPrice);
    
    if (parsedCostBasis < 0 || parsedCostBasis > 999999.99) {
      throw new ValidationError('Cost basis must be between 0 and 999,999.99');
    }
    
    if (parsedRetailPrice <= 0 || parsedRetailPrice > 999999.99) {
      throw new ValidationError('Retail price must be between 0.01 and 999,999.99');
    }

    if (quantityTotal <= 0 || quantityAvailable < 0 || quantityAvailable > quantityTotal) {
      throw new ValidationError('Invalid quantity values');
    }

    // Check if SKU already exists for this user
    const { data: existingSku } = await supabaseAdmin
      .from('inventory_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('sku', sku)
      .single();

    if (existingSku) {
      throw new ValidationError('SKU already exists for this user');
    }

    // Create inventory item
    const { data: newItem, error: createError } = await supabaseAdmin
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
  } catch (error) {
    handleError(error, res);
  }
}