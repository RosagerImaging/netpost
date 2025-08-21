import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { supabaseAdmin } from '../../src/utils/database';
import { generateJWT } from '../../src/utils/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      });
      return;
    }

    // Generate JWT
    const token = generateJWT(user.id);

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionTier: user.subscription_tier,
          subscriptionStatus: user.subscription_status,
          trialEndDate: user.trial_end_date
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}