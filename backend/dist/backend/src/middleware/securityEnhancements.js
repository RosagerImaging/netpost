"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationRateLimit = exports.passwordResetRateLimit = exports.sensitiveOperationRateLimit = void 0;
exports.getBruteForceKey = getBruteForceKey;
exports.checkBruteForce = checkBruteForce;
exports.recordFailedAttempt = recordFailedAttempt;
exports.recordSuccessfulAttempt = recordSuccessfulAttempt;
exports.enhancedAuthProtection = enhancedAuthProtection;
exports.validateInput = validateInput;
const rateLimiting_1 = require("./rateLimiting");
const bruteForceStore = {};
// Progressive lockout periods (in milliseconds)
const LOCKOUT_PERIODS = [
    5 * 60 * 1000, // 5 minutes after 5 attempts
    15 * 60 * 1000, // 15 minutes after 10 attempts
    30 * 60 * 1000, // 30 minutes after 15 attempts
    60 * 60 * 1000, // 1 hour after 20 attempts
    24 * 60 * 60 * 1000 // 24 hours after 25+ attempts
];
function getBruteForceKey(req, email) {
    const ip = (req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'unknown');
    return email ? `${ip}:${email}` : ip;
}
function checkBruteForce(key) {
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
function recordFailedAttempt(key) {
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
        const lockoutIndex = Math.min(Math.floor((entry.attempts - 5) / 5), LOCKOUT_PERIODS.length - 1);
        entry.blockedUntil = now + LOCKOUT_PERIODS[lockoutIndex];
    }
    bruteForceStore[key] = entry;
}
function recordSuccessfulAttempt(key) {
    delete bruteForceStore[key];
}
// Enhanced authentication middleware with brute force protection
function enhancedAuthProtection(req, res) {
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
function validateInput(req, res) {
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
exports.sensitiveOperationRateLimit = (0, rateLimiting_1.createRateLimiter)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 requests per 5 minutes
    message: 'Rate limit exceeded for sensitive operation. Please try again later.'
});
exports.passwordResetRateLimit = (0, rateLimiting_1.createRateLimiter)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset requests per hour
    keyGenerator: (req) => req.body?.email || getBruteForceKey(req),
    message: 'Too many password reset requests. Please try again later.'
});
exports.registrationRateLimit = (0, rateLimiting_1.createRateLimiter)({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 registrations per hour per IP
    message: 'Too many registration attempts. Please try again later.'
});
