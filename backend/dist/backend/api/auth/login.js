"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const securityEnhancements_1 = require("../../src/middleware/securityEnhancements");
const database_1 = require("../../src/utils/database");
const auth_1 = require("../../src/utils/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, securityEnhancements_1.validateInput)(req, res))
        return;
    if (!(0, rateLimiting_1.authRateLimit)(req, res))
        return;
    if (!(0, securityEnhancements_1.enhancedAuthProtection)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new errorHandler_1.ValidationError('Email and password are required');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new errorHandler_1.ValidationError('Invalid email format');
        }
        const bruteForceKey = (0, securityEnhancements_1.getBruteForceKey)(req, email);
        // Get user from database
        const { data: user, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();
        if (userError || !user) {
            (0, securityEnhancements_1.recordFailedAttempt)(bruteForceKey);
            res.status(401).json({
                success: false,
                error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
            });
            return;
        }
        // Verify password
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            (0, securityEnhancements_1.recordFailedAttempt)(bruteForceKey);
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
        (0, securityEnhancements_1.recordSuccessfulAttempt)(bruteForceKey);
        // Generate token pair
        const { accessToken, refreshToken } = (0, auth_1.generateTokenPair)(user.id);
        // Update last login
        await database_1.supabaseAdmin
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
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
