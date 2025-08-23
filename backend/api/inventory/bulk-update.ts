import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { strictRateLimit } from '../../src/middleware/rateLimiting';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!strictRateLimit(req, res)) return;

  if (req.method !== 'PUT') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);
    
    const { items, operation } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Items array is required and cannot be empty');
    }

    if (items.length > 100) {
      throw new ValidationError('Cannot update more than 100 items at once');
    }

    if (!operation || !['update_status', 'update_prices', 'update_category'].includes(operation)) {
      throw new ValidationError('Invalid operation. Must be one of: update_status, update_prices, update_category');
    }

    let updatedItems: any[] = [];

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
  } catch (error) {
    handleError(error, res);
  }
}

async function bulkUpdateStatus(userId: string, items: any[]) {
  const { newStatus } = items[0]; // Assuming all items get the same status
  const itemIds = items.map(item => item.id);

  if (!newStatus || !['active', 'draft', 'archived'].includes(newStatus)) {
    throw new ValidationError('Invalid status');
  }

  // Verify all items belong to the user
  const { data: userItems, error: fetchError } = await supabaseAdmin
    .from('inventory_items')
    .select('id')
    .eq('user_id', userId)
    .in('id', itemIds);

  if (fetchError || !userItems || userItems.length !== itemIds.length) {
    throw new ValidationError('Some items not found or not accessible');
  }

  // Update items
  const { data: updatedItems, error: updateError } = await supabaseAdmin
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

async function bulkUpdatePrices(userId: string, items: any[]) {
  const updatedItems: any[] = [];

  for (const item of items) {
    if (!item.id || !item.retailPrice || item.retailPrice <= 0) {
      continue; // Skip invalid items
    }

    try {
      const { data: updatedItem, error } = await supabaseAdmin
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
    } catch (error) {
      console.error(`Failed to update item ${item.id}:`, error);
      // Continue with other items
    }
  }

  return updatedItems;
}

async function bulkUpdateCategory(userId: string, items: any[]) {
  const { newCategory } = items[0]; // Assuming all items get the same category
  const itemIds = items.map(item => item.id);

  if (!newCategory || newCategory.trim().length === 0) {
    throw new ValidationError('Invalid category');
  }

  // Verify all items belong to the user
  const { data: userItems, error: fetchError } = await supabaseAdmin
    .from('inventory_items')
    .select('id')
    .eq('user_id', userId)
    .in('id', itemIds);

  if (fetchError || !userItems || userItems.length !== itemIds.length) {
    throw new ValidationError('Some items not found or not accessible');
  }

  // Update items
  const { data: updatedItems, error: updateError } = await supabaseAdmin
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