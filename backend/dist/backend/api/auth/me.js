"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        // Get user with preferences
        const { data: userData, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .select(`
        *,
        user_preferences (*),
        platform_credentials (id, platform, is_active, last_verified)
      `)
            .eq('id', user.id)
            .single();
        if (userError || !userData) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' }
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: userData.id,
                    email: userData.email,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    subscriptionTier: userData.subscription_tier,
                    subscriptionStatus: userData.subscription_status,
                    trialEndDate: userData.trial_end_date,
                    subscriptionEndDate: userData.subscription_end_date,
                    lastLoginAt: userData.last_login_at,
                    createdAt: userData.created_at,
                    preferences: userData.user_preferences?.[0] || null,
                    platformCredentials: userData.platform_credentials || []
                }
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
