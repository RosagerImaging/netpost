import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';
import { Platform } from '@shared/types/inventory';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);
    const { 
      sourcePlatform, 
      targetPlatforms, 
      inventoryItems, 
      optimizeSEO = true,
      generateDescriptions = false 
    } = req.body;

    // Validation
    if (!sourcePlatform || !targetPlatforms || !inventoryItems) {
      throw new ValidationError('Source platform, target platforms, and inventory items are required');
    }

    if (!Array.isArray(targetPlatforms) || targetPlatforms.length === 0) {
      throw new ValidationError('At least one target platform is required');
    }

    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      throw new ValidationError('At least one inventory item is required');
    }

    // Validate platforms
    const validPlatforms = Object.values(Platform);
    if (!validPlatforms.includes(sourcePlatform)) {
      throw new ValidationError('Invalid source platform');
    }

    for (const platform of targetPlatforms) {
      if (!validPlatforms.includes(platform)) {
        throw new ValidationError(`Invalid target platform: ${platform}`);
      }
    }

    // Check subscription limits
    const { data: userSubscription } = await supabaseAdmin
      .from('users')
      .select('subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    if (!userSubscription || userSubscription.subscription_status !== 'active') {
      throw new ValidationError('Active subscription required for cross-listing');
    }

    // Create cross-listing request
    const { data: crossListingRequest, error: createError } = await supabaseAdmin
      .from('crosslisting_requests')
      .insert({
        user_id: user.id,
        source_platform: sourcePlatform,
        target_platforms: targetPlatforms,
        inventory_items: inventoryItems,
        status: 'pending',
        optimize_seo: optimizeSEO,
        generate_descriptions: generateDescriptions,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError || !crossListingRequest) {
      console.error('Cross-listing creation error:', createError);
      throw new Error('Failed to create cross-listing request');
    }

    // TODO: Queue cross-listing job for background processing
    // This would typically trigger a background job or webhook
    // For now, we'll just return the request ID

    res.status(201).json({
      success: true,
      data: {
        requestId: crossListingRequest.id,
        status: 'pending',
        estimatedCompletionTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes estimate
        message: 'Cross-listing request created successfully'
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}