"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const database_1 = require("../../src/utils/database");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-08-16',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        const body = JSON.stringify(req.body);
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).json({ error: 'Webhook signature verification failed' });
        return;
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
}
async function handleCheckoutSessionCompleted(session) {
    console.log('Checkout session completed:', session.id);
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType;
    if (!userId) {
        console.error('No userId in session metadata');
        return;
    }
    // Update user subscription status
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_tier: planType,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
    })
        .eq('id', userId);
    console.log(`Updated user ${userId} subscription to ${planType}`);
}
async function handleSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);
    const userId = subscription.metadata?.userId;
    const planType = subscription.metadata?.planType;
    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_tier: planType,
        subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
        subscription_end_date: subscriptionEndDate.toISOString(),
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
    })
        .eq('id', userId);
    console.log(`Created subscription for user ${userId}`);
}
async function handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);
    const userId = subscription.metadata?.userId;
    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    let subscriptionStatus = subscription.status;
    // Map Stripe status to our status
    switch (subscription.status) {
        case 'active':
            subscriptionStatus = 'active';
            break;
        case 'past_due':
            subscriptionStatus = 'past_due';
            break;
        case 'canceled':
            subscriptionStatus = 'canceled';
            break;
        case 'trialing':
            subscriptionStatus = 'trialing';
            break;
        default:
            subscriptionStatus = subscription.status;
    }
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_status: subscriptionStatus,
        subscription_end_date: subscriptionEndDate.toISOString(),
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
    })
        .eq('id', userId);
    console.log(`Updated subscription for user ${userId} to status ${subscriptionStatus}`);
}
async function handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);
    const userId = subscription.metadata?.userId;
    if (!userId) {
        console.error('No userId in subscription metadata');
        return;
    }
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_tier: 'trial',
        subscription_status: 'canceled',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
        .eq('id', userId);
    console.log(`Deleted subscription for user ${userId}`);
}
async function handleInvoicePaymentSucceeded(invoice) {
    console.log('Invoice payment succeeded:', invoice.id);
    const customerId = invoice.customer;
    // Get user by Stripe customer ID
    const { data: user, error } = await database_1.supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
    if (error || !user) {
        console.error('User not found for customer:', customerId);
        return;
    }
    // Update subscription status to active if it was past due
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
    })
        .eq('id', user.id)
        .eq('subscription_status', 'past_due');
    console.log(`Payment succeeded for user ${user.id}`);
}
async function handleInvoicePaymentFailed(invoice) {
    console.log('Invoice payment failed:', invoice.id);
    const customerId = invoice.customer;
    // Get user by Stripe customer ID
    const { data: user, error } = await database_1.supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
    if (error || !user) {
        console.error('User not found for customer:', customerId);
        return;
    }
    // Update subscription status to past due
    await database_1.supabaseAdmin
        .from('users')
        .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
    })
        .eq('id', user.id);
    console.log(`Payment failed for user ${user.id}`);
}
