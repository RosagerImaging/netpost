import { VercelRequest } from '@vercel/node';
import { supabaseAdmin } from './database';
import jwt from 'jsonwebtoken';

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
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

export function generateJWT(userId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}