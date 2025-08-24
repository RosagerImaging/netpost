import { VercelRequest, VercelResponse } from '@vercel/node';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: VercelRequest) => string;
  skipSuccessfulRequests?: boolean;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: VercelRequest) => getClientIP(req),
    message = 'Too many requests, please try again later.'
  } = options;

  return (req: VercelRequest, res: VercelResponse): boolean => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(k => {
      if (rateLimitStore[k].resetTime < now) {
        delete rateLimitStore[k];
      }
    });

    // Get or create rate limit entry
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    const entry = rateLimitStore[key];

    // Reset count if window has expired
    if (entry.resetTime < now) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    // Check if rate limit exceeded
    if (entry.count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
      
      res.status(429).json({
        success: false,
        error: {
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }
      });
      return false;
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - entry.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    return true;
  };
}

function getClientIP(req: VercelRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

// Pre-configured rate limiters
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'Too many API requests, please slow down.'
});

export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute for sensitive operations
  message: 'Rate limit exceeded for this operation.'
});