const { withSentryConfig } = require('@sentry/nextjs');

// Sentry configuration for both dashboard and backend monitoring
const sentryConfig = {
  // Organization and project settings
  org: process.env.SENTRY_ORG,
  project: {
    dashboard: process.env.SENTRY_PROJECT_DASHBOARD || 'netpost-dashboard',
    backend: process.env.SENTRY_PROJECT_BACKEND || 'netpost-backend',
    extension: process.env.SENTRY_PROJECT_EXTENSION || 'netpost-extension'
  },

  // Global Sentry options
  dsn: {
    dashboard: process.env.NEXT_PUBLIC_SENTRY_DSN_DASHBOARD,
    backend: process.env.SENTRY_DSN_BACKEND,
    extension: process.env.SENTRY_DSN_EXTENSION
  },

  // Common configuration
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay (dashboard only)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-essential errors in production
    if (process.env.NODE_ENV === 'production') {
      // Skip network errors that might be user-related
      if (event.exception) {
        const error = hint.originalException;
        if (error && error.name === 'NetworkError') {
          return null;
        }
      }

      // Skip certain tags
      if (event.tags && event.tags.handled === false) {
        // Only send unhandled errors in production
        return event;
      }
    }
    
    return event;
  },

  // Release management
  release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,

  // Additional context
  initialScope: {
    tags: {
      component: 'netpost',
      deployment: process.env.VERCEL_ENV || 'development'
    }
  }
};

module.exports = sentryConfig;