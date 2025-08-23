import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { apiRateLimit } from '../../src/middleware/rateLimiting';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!apiRateLimit(req, res)) return;

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: { message: 'Invalid item ID', code: 'INVALID_ID' }
    });
    return;
  }

  try {
    const user = await requireAuth(req);

    if (req.method === 'GET') {
      return await getInventoryItem(id, user.id, res);
    } else if (req.method === 'PUT') {
      return await updateInventoryItem(id, user.id, req.body, res);
    } else if (req.method === 'DELETE') {
      return await deleteInventoryItem(id, user.id, res);
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    handleError(error, res);
  }
}

async function getInventoryItem(id: string, userId: string, res: VercelResponse) {
  const { data: item, error } = await supabaseAdmin
    .from('inventory_items')
    .select(`
      *,
      marketplace_listings(*),
      seo_analyses(*)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !item) {
    res.status(404).json({
      success: false,
      error: { message: 'Item not found', code: 'ITEM_NOT_FOUND' }
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { item }
  });
}

async function updateInventoryItem(id: string, userId: string, updates: any, res: VercelResponse) {
  // Validate the item exists and belongs to user
  const { data: existingItem, error: fetchError } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existingItem) {
    res.status(404).json({
      success: false,
      error: { message: 'Item not found', code: 'ITEM_NOT_FOUND' }
    });
    return;
  }

  // Validate updates
  const allowedFields = [
    'title', 'description', 'images', 'sku', 'barcode', 'cost_basis',
    'retail_price', 'quantity_total', 'quantity_available', 'category',
    'brand', 'condition', 'size', 'color', 'material', 'weight',
    'dimensions', 'status'
  ];

  const updateData: any = {};
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      updateData[key] = updates[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  // Validate SKU uniqueness if being updated
  if (updateData.sku && updateData.sku !== existingItem.sku) {
    const { data: skuCheck } = await supabaseAdmin
      .from('inventory_items')
      .select('id')
      .eq('user_id', userId)
      .eq('sku', updateData.sku)
      .neq('id', id)
      .single();

    if (skuCheck) {
      throw new ValidationError('SKU already exists for another item');
    }
  }

  // Validate quantity constraints
  if (updateData.quantity_available !== undefined || updateData.quantity_total !== undefined) {
    const newQuantityAvailable = updateData.quantity_available ?? existingItem.quantity_available;
    const newQuantityTotal = updateData.quantity_total ?? existingItem.quantity_total;

    if (newQuantityAvailable < 0 || newQuantityTotal <= 0 || newQuantityAvailable > newQuantityTotal) {
      throw new ValidationError('Invalid quantity values');
    }
  }

  // Update the item
  const { data: updatedItem, error: updateError } = await supabaseAdmin
    .from('inventory_items')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      *,
      marketplace_listings(*)
    `)
    .single();

  if (updateError) {
    console.error('Database error:', updateError);
    throw new Error('Failed to update inventory item');
  }

  // If quantity changed, sync across platforms
  if (updateData.quantity_available !== undefined) {
    try {
      await supabaseAdmin.rpc('sync_inventory_across_platforms', {
        p_inventory_item_id: id
      });
    } catch (syncError) {
      console.error('Failed to sync inventory across platforms:', syncError);
      // Don't fail the update, just log the error
    }
  }

  res.status(200).json({
    success: true,
    data: { item: updatedItem }
  });
}

async function deleteInventoryItem(id: string, userId: string, res: VercelResponse) {
  // Check if item has active listings
  const { data: activeListings } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, platform, status')
    .eq('inventory_item_id', id)
    .in('status', ['active', 'draft']);

  if (activeListings && activeListings.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Cannot delete item with active listings. Please end all listings first.',
        code: 'HAS_ACTIVE_LISTINGS',
        activeListings
      }
    });
    return;
  }

  // Delete the item (cascade will handle related records)
  const { error: deleteError } = await supabaseAdmin
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Database error:', deleteError);
    throw new Error('Failed to delete inventory item');
  }

  res.status(200).json({
    success: true,
    message: 'Item deleted successfully'
  });
}