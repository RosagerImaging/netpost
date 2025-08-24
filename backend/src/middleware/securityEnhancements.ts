import { VercelRequest, VercelResponse } from '@vercel/node';
import { createRateLimiter } from './rateLimiting';

// Enhanced brute force protection for authentication
interface BruteForceEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const bruteForceStore: { [key: string]: BruteForceEntry } = {};

// Progressive lockout periods (in milliseconds)
const LOCKOUT_PERIODS = [
  5 * 60 * 1000,    // 5 minutes after 5 attempts
  15 * 60 * 1000,   // 15 minutes after 10 attempts
  30 * 60 * 1000,   // 30 minutes after 15 attempts
  60 * 60 * 1000,   // 1 hour after 20 attempts
  24 * 60 * 60 * 1000 // 24 hours after 25+ attempts
];

export function getBruteForceKey(req: VercelRequest, email?: string): string {
  const ip = (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.connection?.remoteAddress ||
    'unknown'
  );
  return email ? `${ip}:${email}` : ip;
}

export function checkBruteForce(key: string): { blocked: boolean; retryAfter?: number } {
  const entry = bruteForceStore[key];
  if (!entry) {
    return { blocked: false };
  }

  const now = Date.now();

  // Clean up expired entries
  if (entry.blockedUntil && entry.blockedUntil < now) {
    delete bruteForceStore[key];
    return { blocked: false };
  }

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { 
      blocked: true, 
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) 
    };
  }

  return { blocked: false };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = bruteForceStore[key] || { attempts: 0, lastAttempt: now };
  
  // Reset attempts if last attempt was more than 1 hour ago
  if (now - entry.lastAttempt > 60 * 60 * 1000) {
    entry.attempts = 0;
  }

  entry.attempts++;
  entry.lastAttempt = now;

  // Calculate lockout period
  if (entry.attempts >= 5) {
    const lockoutIndex = Math.min(
      Math.floor((entry.attempts - 5) / 5),
      LOCKOUT_PERIODS.length - 1
    );
    entry.blockedUntil = now + LOCKOUT_PERIODS[lockoutIndex];
  }

  bruteForceStore[key] = entry;
}

export function recordSuccessfulAttempt(key: string): void {
  delete bruteForceStore[key];
}

// Enhanced authentication middleware with brute force protection
export function enhancedAuthProtection(req: VercelRequest, res: VercelResponse): boolean {
  const key = getBruteForceKey(req, req.body?.email);
  const bruteForceCheck = checkBruteForce(key);

  if (bruteForceCheck.blocked) {
    res.setHeader('Retry-After', bruteForceCheck.retryAfter?.toString() || '300');
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many failed attempts. Account temporarily locked.',
        code: 'ACCOUNT_LOCKED',
        retryAfter: bruteForceCheck.retryAfter
      }
    });
    return false;
  }

  return true;
}

// Input validation middleware
export function validateInput(req: VercelRequest, res: VercelResponse): boolean {
  // Check for common injection patterns
  const body = JSON.stringify(req.body || {});
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+set/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(body)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input detected',
          code: 'INVALID_INPUT'
        }
      });
      return false;
    }
  }

  // Check request size
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 5 * 1024 * 1024) { // 5MB limit
    res.status(413).json({
      success: false,
      error: {
        message: 'Request too large',
        code: 'REQUEST_TOO_LARGE'
      }
    });
    return false;
  }

  return true;
}

// Create specialized rate limiters for different endpoints
export const sensitiveOperationRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 5, // 5 requests per 5 minutes
  message: 'Rate limit exceeded for sensitive operation. Please try again later.'
});

export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset requests per hour
  keyGenerator: (req: VercelRequest) => req.body?.email || getBruteForceKey(req),
  message: 'Too many password reset requests. Please try again later.'
});

export const registrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 registrations per hour per IP
  message: 'Too many registration attempts. Please try again later.'
});