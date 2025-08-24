"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const securityEnhancements_1 = require("../../src/middleware/securityEnhancements");
const auth_1 = require("../../src/utils/auth");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, securityEnhancements_1.validateInput)(req, res))
        return;
    if (!(0, rateLimiting_1.apiRateLimit)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new errorHandler_1.ValidationError('Refresh token is required');
        }
        // Verify refresh token
        const tokenData = await (0, auth_1.verifyRefreshToken)(refreshToken);
        if (!tokenData) {
            res.status(401).json({
                success: false,
                error: { message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' }
            });
            return;
        }
        // Generate new token pair
        const { accessToken, refreshToken: newRefreshToken } = (0, auth_1.generateTokenPair)(tokenData.userId);
        res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
