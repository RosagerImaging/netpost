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
    const { requestId } = req.query;

    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Request ID is required', code: 'MISSING_REQUEST_ID' }
      });
      return;
    }

    // Get cross-listing request details
    const { data: request, error } = await supabaseAdmin
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
    } else if (request.status === 'in_progress') {
      progress = 50;
    } else if (request.status === 'failed') {
      progress = 0;
    }

    // Get associated marketplace listings if completed
    let listings = [];
    if (request.status === 'completed' && request.results) {
      const successfulResults = request.results.filter((r: any) => r.status === 'success');
      const listingIds = successfulResults.map((r: any) => r.listingId);
      
      if (listingIds.length > 0) {
        const { data: marketplaceListings } = await supabaseAdmin
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
  } catch (error) {
    handleError(error, res);
  }
}