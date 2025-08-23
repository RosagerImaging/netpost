import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError } from '../../src/middleware/errorHandler';
import { requireAuth, generateJWT } from '../../src/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);

    // Generate new JWT token
    const token = generateJWT(user.id);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}