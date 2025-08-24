"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.requireAuth = requireAuth;
exports.generateJWT = generateJWT;
const database_1 = require("./database");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
function generateJWT(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    return jsonwebtoken_1.default.sign({ userId, iat: Math.floor(Date.now() / 1000) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
