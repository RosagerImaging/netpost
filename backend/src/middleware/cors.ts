import { VercelRequest, VercelResponse } from '@vercel/node';

// Get allowed origins from environment variables or use defaults
const getAllowedOrigins = (): string[] => {
  const baseOrigins = [
    // Production domains (can be overridden via environment)
    process.env.NEXT_PUBLIC_APP_URL || 'https://netpost.app',
    'https://www.netpost.app',
    'https://dashboard.netpost.app',
    'https://app.netpost.app',
    // Chrome extension origins
    'chrome-extension://'
  ];

  // Add custom allowed origins from environment if specified
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const customOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    baseOrigins.push(...customOrigins);
  }

  // In development, allow localhost origins
  if (process.env.NODE_ENV === 'development') {
    baseOrigins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    );
  }

  return baseOrigins;
};

const allowedOrigins = getAllowedOrigins();

export function corsMiddleware(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string;
  
  // Check if origin is allowed
  const isAllowedOrigin = allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.startsWith('chrome-extension://')) {
      return origin?.startsWith('chrome-extension://');
    }
    return origin === allowedOrigin;
  });

  // In development, allow localhost origins
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');

  if (isAllowedOrigin || (isDevelopment && isLocalhost)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (isDevelopment) {
    // In development, be more permissive but log the origin
    console.warn(`CORS: Allowing unregistered origin in development: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Enhanced Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (CSP)
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://api.openai.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspPolicy);
  
  // Additional security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Don't continue processing
  }

  return true; // Continue processing
}