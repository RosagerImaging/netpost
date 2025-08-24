import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { registrationRateLimit } from '../../src/middleware/securityEnhancements';
import { validateInput } from '../../src/middleware/securityEnhancements';
import { supabaseAdmin } from '../../src/utils/database';
import { generateTokenPair } from '../../src/utils/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!validateInput(req, res)) return;
  if (!registrationRateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Enhanced password validation
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    // Validate name inputs if provided
    if (firstName && (firstName.length > 50 || !/^[a-zA-Z\s'-]+$/.test(firstName))) {
      throw new ValidationError('Invalid first name format');
    }

    if (lastName && (lastName.length > 50 || !/^[a-zA-Z\s'-]+$/.test(lastName))) {
      throw new ValidationError('Invalid last name format');
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

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(newUser.id);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
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