"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.requireAuth = requireAuth;
exports.generateTokenPair = generateTokenPair;
exports.generateJWT = generateJWT;
exports.verifyRefreshToken = verifyRefreshToken;
const database_1 = require("./database");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const encryption_1 = require("./encryption");
async function authenticateUser(req) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
            issuer: 'netpost-api',
            audience: 'netpost-app'
        });
        // Only accept access tokens for authentication
        if (decoded.type && decoded.type !== 'access') {
            return null;
        }
        // Get user from database
        const { data: user, error } = await database_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}
async function requireAuth(req) {
    const user = await authenticateUser(req);
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}
function generateTokenPair(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    const now = Math.floor(Date.now() / 1000);
    // Access token - short lived (15 minutes)
    const accessToken = jsonwebtoken_1.default.sign({
        userId,
        type: 'access',
        iat: now,
        jti: encryption_1.EncryptionService.generateSecureToken(16) // JWT ID for tracking
    }, process.env.JWT_SECRET, {
        expiresIn: '15m',
        issuer: 'netpost-api',
        audience: 'netpost-app'
    });
    // Refresh token - long lived (7 days)
    const refreshToken = jsonwebtoken_1.default.sign({
        userId,
        type: 'refresh',
        iat: now,
        jti: encryption_1.EncryptionService.generateSecureToken(16)
    }, process.env.JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'netpost-api',
        audience: 'netpost-app'
    });
    return { accessToken, refreshToken };
}
function generateJWT(userId) {
    // Legacy function for backward compatibility
    return generateTokenPair(userId).accessToken;
}
async function verifyRefreshToken(refreshToken) {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET, {
            issuer: 'netpost-api',
            audience: 'netpost-app'
        });
        if (decoded.type !== 'refresh') {
            return null;
        }
        // Verify user still exists and is active
        const { data: user, error } = await database_1.supabaseAdmin
            .from('users')
            .select('id, subscription_status')
            .eq('id', decoded.userId)
            .single();
        if (error || !user || user.subscription_status === 'canceled') {
            return null;
        }
        return { userId: decoded.userId };
    }
    catch (error) {
        console.error('Refresh token verification error:', error);
        return null;
    }
}
