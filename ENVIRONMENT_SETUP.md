# NetPost Environment Configuration Guide

This guide helps you set up the environment variables required for NetPost deployment across different environments.

## Overview

NetPost uses environment variables for configuration across three main components:
- **Dashboard** (Next.js frontend)
- **Backend** (Vercel serverless functions)
- **Chrome Extension** (browser extension)

## File Structure

```
netpost/
├── .env.example              # Template with all possible variables
├── .env.local               # Root environment file (development)
├── .env                     # Current environment file
├── dashboard/
│   └── .env.local          # Dashboard-specific environment variables
└── backend/
    └── .env.local          # Backend-specific environment variables
```

## Quick Setup

### 1. Copy Template Files
```bash
# Copy the example file to create your environment files
cp .env.example .env.local

# Dashboard environment
cp dashboard/.env.local dashboard/.env.production.local  # For production

# Backend environment  
cp backend/.env.local backend/.env.production.local     # For production
```

### 2. Required Environment Variables

#### Supabase Configuration (CRITICAL)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (from Supabase dashboard)
DATABASE_URL=postgresql://postgres:password@db.project-id.supabase.co:5432/postgres
```

**Where to get these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the URL and keys

#### Authentication (CRITICAL)
```env
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production-min-32-chars
```

**Generate with:**
```bash
openssl rand -base64 32
```

#### Stripe Payment Processing (REQUIRED for billing)
```env
STRIPE_SECRET_KEY=sk_live_... (or sk_test_ for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_ for development)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook settings)
```

**Where to get these:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Create or copy API keys
3. Set up webhooks for subscription management

#### AI Services (REQUIRED for SEO)
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
# OR alternatively
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

#### Platform APIs (REQUIRED for cross-listing)
```env
EBAY_CLIENT_ID=your-ebay-client-id-here
EBAY_CLIENT_SECRET=your-ebay-client-secret-here
EBAY_REDIRECT_URI=https://your-domain.com/auth/ebay/callback
```

**Where to get these:**
1. Go to [eBay Developers](https://developer.ebay.com/)
2. Create a new app
3. Copy the client credentials

### 3. Production URLs (UPDATE FOR DEPLOYMENT)
```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## Environment-Specific Configuration

### Development
- Use `NODE_ENV=development`
- Use localhost URLs
- Use test API keys where available
- Use development Supabase project

### Production
- Use `NODE_ENV=production`
- Use production domain URLs
- Use live API keys (not test keys)
- Use production Supabase project
- Ensure all secrets are properly secured

## Security Best Practices

### 1. Secret Generation
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (32 characters hex)
openssl rand -hex 32
```

### 2. Environment File Security
- Never commit `.env.local`, `.env.production.local`, or `.env` files
- Always use `.env.example` as a template
- Store production secrets in Vercel environment variables
- Use different secrets for development and production

### 3. Vercel Deployment
When deploying to Vercel, add environment variables in:
1. Vercel Dashboard > Project > Settings > Environment Variables
2. Or use Vercel CLI:
```bash
vercel env add VARIABLE_NAME
```

## Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify SUPABASE_URL and keys are correct
   - Check if Supabase project is active
   - Ensure database URL includes correct password

2. **Authentication Failures**
   - Ensure JWT_SECRET is set and consistent across services
   - Verify JWT_SECRET is at least 32 characters

3. **Stripe Integration Issues**
   - Verify you're using the correct keys (test vs live)
   - Ensure webhook secret matches your Stripe webhook configuration
   - Check webhook endpoint URL in Stripe dashboard

4. **CORS Errors**
   - Verify NEXT_PUBLIC_APP_URL matches your deployment domain
   - Check backend/vercel.json for correct allowed origins
   - Ensure no trailing slashes in URLs

### Environment Variable Priority

Next.js loads environment variables in this order:
1. `.env.production.local` (production only)
2. `.env.local` (always loaded except during test)
3. `.env.production` (production only)
4. `.env`

## Validation Checklist

Before deploying, ensure:

- [ ] All CRITICAL variables are set with real values
- [ ] Supabase connection works (test with API call)
- [ ] Stripe keys are correct environment (test vs live)
- [ ] JWT_SECRET is secure and consistent
- [ ] Production URLs are updated
- [ ] Chrome Extension ID is published extension ID
- [ ] All API keys have proper permissions
- [ ] Email SMTP is configured (if using email features)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Test connections to external services (Supabase, Stripe, etc.)
4. Check Vercel deployment logs for specific error messages