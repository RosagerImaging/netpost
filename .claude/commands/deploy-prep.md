# /deploy-prep
Prepare netpost application for production deployment to Vercel and Supabase.

## Pre-deployment Checklist

### 1. Backend API Preparation
1. **Testing & Quality**
   - Navigate to backend directory: `cd backend/` or `cd ../netpost-backend`
   - Run test suite: `npm test`
   - Check TypeScript compilation: `npm run build`
   - Verify ESLint passes: `npx eslint . --ext .ts`

2. **Security Audit**
   - Run security audit: `npm audit --audit-level moderate`
   - Check environment variables in .env.example are documented
   - Verify rate limiting is configured in src/middleware/rateLimiting.ts
   - Validate CORS settings in src/middleware/cors.ts

3. **Database & API**
   - Test Supabase connection: Check database/migrations/ are applied
   - Verify API endpoints work: Test critical endpoints in api/
   - Check authentication flows: Test api/auth/ endpoints
   - Validate error handling in src/middleware/errorHandler.ts

### 2. Dashboard Frontend Preparation  
1. **Build & Testing**
   - Navigate to dashboard directory: `cd dashboard/` or `cd ../netpost-dashboard`
   - Create production build: `npm run build`
   - Run test suite: `npm test`
   - Check for build warnings or errors

2. **Performance & Quality**
   - Analyze bundle size: Check build output for large bundles
   - Verify images are optimized in public/
   - Test responsive design on mobile/tablet
   - Check accessibility with screen readers

3. **Configuration**
   - Verify environment variables for production in .env.example
   - Check API endpoints point to production backend
   - Validate next.config.js settings
   - Test authentication flows with production Supabase

### 3. Chrome Extension Preparation
1. **Build & Testing**
   - Navigate to extension directory: `cd chrome-extension/` or `cd ../netpost-chrome-extension`
   - Build extension: `npm run build`
   - Test manifest.json is valid
   - Verify extension works in Chrome

### 4. Final Validation
1. **Cross-Platform Testing**
   - Test complete user flows: registration → login → core features
   - Verify data sync between dashboard and extension
   - Test API rate limiting and error responses
   - Validate user permissions and security

2. **Deployment Configuration**
   - Check Vercel configuration: backend/vercel.json and dashboard/vercel.json
   - Verify Supabase environment variables
   - Test production database migrations
   - Confirm backup procedures are in place

3. **Documentation**
   - Update DEVELOPMENT_COMPLETE.md if needed
   - Verify README files are current
   - Check API documentation is up to date
   - Update version numbers in package.json files

## Deployment Commands
- **Backend**: Deploy via Vercel CLI or GitHub integration
- **Dashboard**: Deploy via Vercel CLI or GitHub integration  
- **Database**: Apply migrations via Supabase CLI or dashboard
- **Extension**: Package for Chrome Web Store submission