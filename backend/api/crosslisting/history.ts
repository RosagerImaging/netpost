import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError } from '../../src/middleware/errorHandler';
import { apiRateLimit } from '../../src/middleware/rateLimiting';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!apiRateLimit(req, res)) return;

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
      status = '',
      platform = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build query
    let query = supabaseAdmin
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
    query = query.order(sortBy as string, { 
      ascending: sortOrder === 'asc' 
    });

    // Apply pagination
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: requests, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch cross-listing history');
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('crosslisting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Calculate statistics
    const { data: stats } = await supabaseAdmin
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

    const { count: monthlyCount } = await supabaseAdmin
      .from('crosslisting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', currentMonth.toISOString());

    res.status(200).json({
      success: true,
      data: {
        requests: requests || [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / parseInt(limit as string))
        },
        statistics,
        monthlyUsage: monthlyCount || 0
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}