import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { authRateLimit } from '../../src/middleware/rateLimiting';
import { enhancedAuthProtection, getBruteForceKey, recordFailedAttempt, recordSuccessfulAttempt, validateInput } from '../../src/middleware/securityEnhancements';
import { supabaseAdmin } from '../../src/utils/database';
import { generateTokenPair } from '../../src/utils/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!validateInput(req, res)) return;
  if (!authRateLimit(req, res)) return;
  if (!enhancedAuthProtection(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    const bruteForceKey = getBruteForceKey(req, email);

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      recordFailedAttempt(bruteForceKey);
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      recordFailedAttempt(bruteForceKey);
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      });
      return;
    }

    // Check if account is active
    if (user.subscription_status === 'canceled') {
      res.status(403).json({
        success: false,
        error: { message: 'Account has been canceled', code: 'ACCOUNT_CANCELED' }
      });
      return;
    }

    // Clear brute force attempts on successful login
    recordSuccessfulAttempt(bruteForceKey);

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user.id);

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
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