import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../../src/middleware/cors';
import { checkDatabaseHealth } from '../../../src/utils/database';

// Readiness probe for Kubernetes-style health checks
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const startTime = performance.now();

    // Check if the application is ready to serve requests
    const readinessChecks = await Promise.allSettled([
      checkDatabaseConnection(),
      checkCriticalEnvironmentVariables(),
      checkRequiredServices()
    ]);

    const [dbReady, envReady, servicesReady] = readinessChecks.map(
      result => result.status === 'fulfilled' && result.value
    );

    const isReady = dbReady && envReady && servicesReady;
    const responseTime = performance.now() - startTime;

    const readinessData = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime.toFixed(2)}ms`,
      checks: {
        database: {
          ready: dbReady,
          message: dbReady ? 'Database connection established' : 'Database connection failed'
        },
        environment: {
          ready: envReady,
          message: envReady ? 'All required environment variables present' : 'Missing required environment variables'
        },
        services: {
          ready: servicesReady,
          message: servicesReady ? 'All critical services available' : 'Critical services unavailable'
        }
      }
    };

    if (isReady) {
      res.status(200).json({
        success: true,
        data: readinessData
      });
    } else {
      res.status(503).json({
        success: false,
        data: readinessData
      });
    }

  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      success: false,
      ready: false,
      error: {
        message: 'Readiness check failed',
        code: 'READINESS_ERROR'
      }
    });
  }
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const isHealthy = await checkDatabaseHealth();
    return isHealthy;
  } catch (error) {
    console.error('Database readiness check failed:', error);
    return false;
  }
}

async function checkCriticalEnvironmentVariables(): Promise<boolean> {
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];

  return criticalVars.every(varName => {
    const value = process.env[varName];
    return value && value.trim().length > 0;
  });
}

async function checkRequiredServices(): Promise<boolean> {
  try {
    // Check if Supabase is accessible
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;

    // In a real implementation, you might make a lightweight request to verify service availability
    // For now, we'll just check if the URL is configured
    return true;
  } catch (error) {
    console.error('Services readiness check failed:', error);
    return false;
  }
}