import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { strictRateLimit } from '../../src/middleware/rateLimiting';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!strictRateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);
    const { priceId, planType } = req.body;

    if (!priceId || !planType) {
      throw new ValidationError('Price ID and plan type are required');
    }

    // Validate plan type
    const validPlanTypes = ['starter', 'professional', 'enterprise'];
    if (!validPlanTypes.includes(planType)) {
      throw new ValidationError('Invalid plan type');
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;

    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw new Error('Failed to fetch user data');
    }

    if (userData.stripe_customer_id) {
      stripeCustomerId = userData.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planType: planType,
        },
        trial_period_days: planType === 'starter' ? 7 : 0, // 7-day trial for starter plan
      },
      metadata: {
        userId: user.id,
        planType: planType,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
}