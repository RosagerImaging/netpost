// Sentry configuration for Next.js Dashboard
import { withSentryConfig } from '@sentry/nextjs';

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_DASHBOARD || 'netpost-dashboard',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Upload source maps in production only
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring/tunnel',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_DASHBOARD,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture Replay for 10% of sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // User context
  beforeSend(event, hint) {
    // Filter out handled errors in production
    if (process.env.NODE_ENV === 'production' && event.level === 'error') {
      const error = hint.originalException;
      
      // Skip certain error types
      if (error && (
        error.name === 'ChunkLoadError' ||
        error.name === 'ResizeObserver loop limit exceeded' ||
        error.message?.includes('Non-Error promise rejection')
      )) {
        return null;
      }
    }

    return event;
  },

  // Additional context
  initialScope: {
    tags: {
      component: 'dashboard',
      platform: 'web'
    }
  },

  // Integrations configuration
  integrations: [
    // Enable performance monitoring
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.nextRouterInstrumentation(router),
    }),
    // Enable session replay
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ]
};

export default sentryOptions;
export { sentryWebpackPluginOptions };