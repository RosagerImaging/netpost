import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError } from '../../src/middleware/errorHandler';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);

    // Parse query parameters
    const { 
      page = '1', 
      limit = '20', 
      search = '', 
      category = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build query
    let query = supabaseAdmin
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
    query = query.order(sortBy as string, { 
      ascending: sortOrder === 'asc' 
    });

    // Apply pagination
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: items, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch inventory items');
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    res.status(200).json({
      success: true,
      data: {
        items: items || [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}