"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-08-16',
});
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, rateLimiting_1.apiRateLimit)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        const { action } = req.body;
        if (!action) {
            throw new errorHandler_1.ValidationError('Action is required');
        }
        // Get user's Stripe customer ID
        const { data: userData, error: userError } = await database_1.supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();
        if (userError || !userData.stripe_customer_id) {
            throw new errorHandler_1.ValidationError('No billing account found');
        }
        const customerId = userData.stripe_customer_id;
        switch (action) {
            case 'create_portal_session':
                return await createPortalSession(customerId, res);
            case 'cancel_subscription':
                return await cancelSubscription(customerId, user.id, res);
            case 'reactivate_subscription':
                return await reactivateSubscription(customerId, user.id, res);
            default:
                throw new errorHandler_1.ValidationError('Invalid action');
        }
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
async function createPortalSession(customerId, res) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });
    res.status(200).json({
        success: true,
        data: {
            url: session.url,
        },
    });
}
async function cancelSubscription(customerId, userId, res) {
    // Get customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
    });
    if (subscriptions.data.length === 0) {
        throw new errorHandler_1.ValidationError('No active subscription found');
    }
    // Cancel the subscription at period end
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
    });
    // Update user status in database
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
    })
        .eq('id', userId);
    res.status(200).json({
        success: true,
        message: 'Subscription will be canceled at the end of the current period',
    });
}
async function reactivateSubscription(customerId, userId, res) {
    // Get customer's canceled subscriptions
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
    });
    if (subscriptions.data.length === 0) {
        throw new errorHandler_1.ValidationError('No subscription found to reactivate');
    }
    // Reactivate subscription
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
    });
    // Update user status in database
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
    })
        .eq('id', userId);
    res.status(200).json({
        success: true,
        message: 'Subscription reactivated successfully',
    });
}
