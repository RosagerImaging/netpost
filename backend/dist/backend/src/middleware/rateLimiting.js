"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimit = exports.apiRateLimit = exports.authRateLimit = void 0;
exports.createRateLimiter = createRateLimiter;
// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = {};
function createRateLimiter(options) {
    const { windowMs, maxRequests, keyGenerator = (req) => getClientIP(req), message = 'Too many requests, please try again later.' } = options;
    return (req, res) => {
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
function getClientIP(req) {
    return (req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'unknown');
}
// Pre-configured rate limiters
exports.authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
});
exports.apiRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many API requests, please slow down.'
});
exports.strictRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute for sensitive operations
    message: 'Rate limit exceeded for this operation.'
});
