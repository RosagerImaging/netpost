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
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { message: 'User already exists', code: 'USER_EXISTS' }
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_end_date: trialEndDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error('User creation error:', createError);
      throw new Error('Failed to create user');
    }

    // Create default user preferences
    await supabaseAdmin
      .from('user_preferences')
      .insert({
        user_id: newUser.id,
        dark_mode: false,
        auto_optimize_seo: true,
        enable_auto_delisting: true,
        default_listing_duration: 7,
        email_notifications: true,
        price_optimization_enabled: true,
        ai_description_enabled: true,
        updated_at: new Date().toISOString()
      });

    // Generate JWT
    const token = generateJWT(newUser.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          subscriptionTier: newUser.subscription_tier,
          subscriptionStatus: newUser.subscription_status,
          trialEndDate: newUser.trial_end_date
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}