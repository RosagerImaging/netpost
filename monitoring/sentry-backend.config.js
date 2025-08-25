// Sentry configuration for Vercel serverless functions
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for backend functions
export function initSentry() {
  if (Sentry.getCurrentHub().getClient()) {
    return; // Already initialized
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling (production only)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Integrations
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
    ],

    // Error filtering and enhancement
    beforeSend(event, hint) {
      // Add request context if available
      if (hint.originalException && hint.contexts?.vercel) {
        event.contexts.vercel = hint.contexts.vercel;
      }

      // Filter out non-critical errors in production
      if (process.env.NODE_ENV === 'production') {
        const error = hint.originalException;
        
        // Skip certain error types
        if (error && (
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('Connection terminated unexpectedly')
        )) {
          return null;
        }
      }

      return event;
    },

    // Initial context
    initialScope: {
      tags: {
        component: 'backend',
        platform: 'vercel'
      }
    }
  });
}

// Wrapper function for API handlers
export function withSentry(handler) {
  return async (req, res) => {
    initSentry();
    
    // Start a transaction for this request
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${req.method} ${req.url}`,
    });

    Sentry.configureScope(scope => {
      scope.setSpan(transaction);
      scope.setTag('method', req.method);
      scope.setTag('url', req.url);
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
      });
    });

    try {
      const result = await handler(req, res);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  };
}

// Database query monitoring
export function monitorDatabaseQuery(queryName, queryFn) {
  return async (...args) => {
    const span = Sentry.startSpan({
      op: 'db.query',
      description: queryName,
    });

    try {
      const startTime = Date.now();
      const result = await queryFn(...args);
      const duration = Date.now() - startTime;
      
      span.setData('duration', duration);
      span.setStatus('ok');
      
      // Log slow queries
      if (duration > 1000) {
        Sentry.addBreadcrumb({
          category: 'db.slow_query',
          message: `Slow query: ${queryName}`,
          level: 'warning',
          data: { duration, queryName }
        });
      }

      return result;
    } catch (error) {
      span.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      span.finish();
    }
  };
}

export default { initSentry, withSentry, monitorDatabaseQuery };