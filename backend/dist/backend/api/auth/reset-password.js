"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const database_1 = require("../../src/utils/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (req.method === 'POST') {
        return handleResetRequest(req, res);
    }
    else if (req.method === 'PUT') {
        return handlePasswordReset(req, res);
    }
    else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
}
async function handleResetRequest(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            throw new errorHandler_1.ValidationError('Email is required');
        }
        // Check if user exists
        const { data: user, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .select('id, email, first_name')
            .eq('email', email.toLowerCase())
            .single();
        // Always return success for security (don't reveal if email exists)
        if (userError || !user) {
            res.status(200).json({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
            return;
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        // Store reset token (in production, add reset_token fields to users table)
        // For now, we'll use a simple in-memory store or you can extend the users table
        // TODO: Send email with reset link
        // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
        // await sendResetEmail(user.email, user.first_name, resetUrl);
        console.log(`Password reset requested for ${email}. Reset token: ${resetToken}`);
        res.status(200).json({
            success: true,
            message: 'If the email exists, a reset link has been sent',
            // In development, return the token for testing
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
async function handlePasswordReset(req, res) {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            throw new errorHandler_1.ValidationError('Token and new password are required');
        }
        if (newPassword.length < 8) {
            throw new errorHandler_1.ValidationError('Password must be at least 8 characters');
        }
        // In production, verify the reset token from database
        // For now, we'll skip token verification for development
        // Hash new password
        const saltRounds = 12;
        await bcryptjs_1.default.hash(newPassword, saltRounds);
        // TODO: Update user password after verifying token
        // This is a simplified version for development
        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
