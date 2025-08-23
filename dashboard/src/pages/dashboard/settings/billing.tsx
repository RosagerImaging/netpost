import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { withAuth, useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api';
import {
  CreditCardIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState('');

  // Handle successful checkout
  useEffect(() => {
    const { session_id } = router.query;
    if (session_id) {
      // Checkout was successful, refresh user data
      queryClient.invalidateQueries(['user']);
      // Show success message or redirect
      router.replace('/dashboard/settings/billing', undefined, { shallow: true });
    }
  }, [router.query, queryClient, router]);

  // Stripe pricing (these would typically come from your Stripe dashboard)
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      priceId: 'price_starter', // Replace with actual Stripe price ID
      features: [
        '25 cross-listings per month',
        'Basic SEO optimization',
        '2 platform integrations',
        'Email support',
        '7-day free trial'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      priceId: 'price_professional', // Replace with actual Stripe price ID
      features: [
        '100 cross-listings per month',
        'Advanced SEO optimization',
        'All platform integrations',
        'Priority support',
        'Business analytics',
        'Bulk operations',
        'API access'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      priceId: 'price_enterprise', // Replace with actual Stripe price ID
      features: [
        'Unlimited cross-listings',
        'AI-powered optimization',
        'All platform integrations',
        '24/7 priority support',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  // Create checkout session mutation
  const createCheckoutSession = useMutation(
    async (planData: { priceId: string; planType: string }) => {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getToken()}`
        },
        body: JSON.stringify(planData)
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data;
    },
    {
      onSuccess: (data) => {
        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        console.error('Failed to create checkout session:', error);
        // Handle error - show toast or error message
      }
    }
  );

  // Cancel subscription mutation
  const cancelSubscription = useMutation(
    async () => {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user']);
        // Show success message
      },
      onError: (error) => {
        console.error('Failed to cancel subscription:', error);
        // Handle error
      }
    }
  );

  // Get current user's plan information
  const getCurrentPlan = () => {
    if (!user) return null;
    return plans.find(plan => plan.id === user.subscriptionTier) || null;
  };

  const handleUpgrade = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      createCheckoutSession.mutate({
        priceId: plan.priceId,
        planType: plan.id
      });
    }
  };

  const currentPlan = getCurrentPlan();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
          <p className="text-sm text-gray-600">
            Manage your subscription and billing preferences
          </p>
        </div>

        {/* Current Subscription Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Current Subscription</h3>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <SparklesIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {currentPlan ? currentPlan.name : 'Free Trial'}
                  </span>
                  {user?.subscriptionStatus === 'trialing' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Trial
                    </span>
                  )}
                  {user?.subscriptionStatus === 'active' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {currentPlan ? `$${currentPlan.price}/month` : 'Free'}
                </p>
                {user?.trialEndDate && user.subscriptionStatus === 'trialing' && (
                  <p className="text-sm text-gray-600">
                    Trial ends on {new Date(user.trialEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                {user?.subscriptionStatus === 'active' && (
                  <button
                    onClick={() => cancelSubscription.mutate()}
                    disabled={cancelSubscription.isLoading}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {cancelSubscription.isLoading ? (
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 mr-2" />
                    )}
                    Cancel Subscription
                  </button>
                )}
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Manage Payment Methods
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Available Plans</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={clsx(
                    "relative rounded-lg border p-6",
                    plan.popular ? "border-indigo-500 bg-indigo-50" : "border-gray-200",
                    currentPlan?.id === plan.id && "ring-2 ring-indigo-500"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-500 text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {currentPlan?.id === plan.id && (
                    <div className="absolute -top-2 right-4">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-sm text-gray-600">/month</span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="ml-2 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {currentPlan?.id === plan.id ? (
                      <button
                        disabled
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={createCheckoutSession.isLoading}
                        className={clsx(
                          "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50",
                          plan.popular
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-gray-600 hover:bg-gray-700"
                        )}
                      >
                        {createCheckoutSession.isLoading ? (
                          <ArrowPathIcon className="animate-spin h-4 w-4" />
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Your billing history will appear here once you have an active subscription.
              </p>
              <div className="mt-4">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Download Invoice History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Can I change my plan anytime?</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and you&apos;ll be prorated for the difference.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Do you offer refunds?</h4>
                <p className="mt-1 text-sm text-gray-600">
                  We offer a 30-day money-back guarantee for new subscribers. Contact support for assistance.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">How does the free trial work?</h4>
                <p className="mt-1 text-sm text-gray-600">
                  The Starter plan includes a 7-day free trial. No credit card required during the trial period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(BillingPage);