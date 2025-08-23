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

    // Get user with preferences
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_preferences (*),
        platform_credentials (id, platform, is_active, last_verified)
      `)
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          subscriptionTier: userData.subscription_tier,
          subscriptionStatus: userData.subscription_status,
          trialEndDate: userData.trial_end_date,
          subscriptionEndDate: userData.subscription_end_date,
          lastLoginAt: userData.last_login_at,
          createdAt: userData.created_at,
          preferences: userData.user_preferences?.[0] || null,
          platformCredentials: userData.platform_credentials || []
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}