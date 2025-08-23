import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../src/utils/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    const body = JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Update user subscription status
  await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: planType,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`Updated user ${userId} subscription to ${planType}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  const userId = subscription.metadata?.userId;
  const planType = subscription.metadata?.planType;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

  await supabaseAdmin
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

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
  let subscriptionStatus: string = subscription.status;

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

  await supabaseAdmin
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

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  await supabaseAdmin
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

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  const customerId = invoice.customer as string;

  // Get user by Stripe customer ID
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status to active if it was past due
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .eq('subscription_status', 'past_due');

  console.log(`Payment succeeded for user ${user.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  const customerId = invoice.customer as string;

  // Get user by Stripe customer ID
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status to past due
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  console.log(`Payment failed for user ${user.id}`);
}