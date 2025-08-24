import { VercelRequest } from '@vercel/node';
import { supabaseAdmin } from './database';
import jwt from 'jsonwebtoken';
import { EncryptionService } from './encryption';

export interface AuthUser {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

export async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'netpost-api',
      audience: 'netpost-app'
    }) as any;
    
    // Only accept access tokens for authentication
    if (decoded.type && decoded.type !== 'access') {
      return null;
    }
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier,
      subscriptionStatus: user.subscription_status
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(req: VercelRequest): Promise<AuthUser> {
  const user = await authenticateUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokenPair(userId: string): TokenPair {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign(
    { 
      userId, 
      type: 'access',
      iat: now,
      jti: EncryptionService.generateSecureToken(16) // JWT ID for tracking
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '15m',
      issuer: 'netpost-api',
      audience: 'netpost-app'
    }
  );

  // Refresh token - long lived (7 days)
  const refreshToken = jwt.sign(
    { 
      userId, 
      type: 'refresh',
      iat: now,
      jti: EncryptionService.generateSecureToken(16)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'netpost-api',
      audience: 'netpost-app'
    }
  );

  return { accessToken, refreshToken };
}

export function generateJWT(userId: string): string {
  // Legacy function for backward compatibility
  return generateTokenPair(userId).accessToken;
}

export async function verifyRefreshToken(refreshToken: string): Promise<{ userId: string } | null> {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, {
      issuer: 'netpost-api',
      audience: 'netpost-app'
    }) as any;

    if (decoded.type !== 'refresh') {
      return null;
    }

    // Verify user still exists and is active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, subscription_status')
      .eq('id', decoded.userId)
      .single();

    if (error || !user || user.subscription_status === 'canceled') {
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
}