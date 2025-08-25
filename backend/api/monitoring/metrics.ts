import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { PerformanceMonitor } from '../../../monitoring/performance.config';
import { checkDatabaseHealth, getQueryMetrics } from '../../src/utils/database';

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const timerId = performanceMonitor.startTimer('metrics_collection');
    
    // Check if request is authorized (admin or monitoring service)
    const isAuthorized = checkAuthorization(req);
    if (!isAuthorized) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized access to metrics endpoint'
      });
      return;
    }

    // Collect system metrics
    const systemMetrics = performanceMonitor.getSystemMetrics();
    
    // Get database metrics
    const dbHealth = await checkDatabaseHealth();
    const queryMetrics = getQueryMetrics();
    
    // Calculate performance statistics
    const performanceStats = calculatePerformanceStats(queryMetrics);
    
    // Get API response time metrics (last hour)
    const apiMetrics = getApiResponseMetrics();
    
    const metricsData = {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      database: {
        health: dbHealth,
        connectionPool: getDatabasePoolMetrics(),
        queryStats: {
          total: queryMetrics.length,
          slow: queryMetrics.filter(q => q.duration > 500).length,
          failed: queryMetrics.filter(q => q.error).length,
          averageResponseTime: performanceStats.averageResponseTime,
          p95ResponseTime: performanceStats.p95ResponseTime,
          p99ResponseTime: performanceStats.p99ResponseTime
        }
      },
      api: {
        ...apiMetrics,
        errorRate: calculateErrorRate(),
        throughput: calculateThroughput()
      },
      performance: {
        responseTime: performanceMonitor.endTimer(timerId),
        healthScore: calculateHealthScore(systemMetrics, dbHealth, performanceStats)
      }
    };

    res.status(200).json({
      success: true,
      data: metricsData
    });

  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to collect metrics',
        code: 'METRICS_ERROR'
      }
    });
  }
}

function checkAuthorization(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const monitoringKey = req.headers['x-monitoring-key'];
  
  // Check for admin token
  if (authHeader?.includes('admin')) return true;
  
  // Check for monitoring service key
  if (monitoringKey === process.env.MONITORING_API_KEY) return true;
  
  // Check for development environment
  if (process.env.NODE_ENV === 'development') return true;
  
  return false;
}

function calculatePerformanceStats(queryMetrics: any[]) {
  if (queryMetrics.length === 0) {
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    };
  }

  const durations = queryMetrics.map(q => q.duration).sort((a, b) => a - b);
  const total = durations.reduce((sum, d) => sum + d, 0);
  
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  return {
    averageResponseTime: total / durations.length,
    p95ResponseTime: durations[p95Index] || 0,
    p99ResponseTime: durations[p99Index] || 0
  };
}

function getDatabasePoolMetrics() {
  // Placeholder for database connection pool metrics
  // This would integrate with your database driver's pool metrics
  return {
    totalConnections: 10,
    activeConnections: 3,
    idleConnections: 7,
    pendingRequests: 0
  };
}

function getApiResponseMetrics() {
  // Placeholder for API metrics
  // This would be populated from your metrics storage
  return {
    totalRequests: 1500,
    successfulRequests: 1485,
    failedRequests: 15,
    averageResponseTime: 245,
    p95ResponseTime: 580,
    p99ResponseTime: 1200
  };
}

function calculateErrorRate(): number {
  // Calculate error rate from recent requests
  // This would be populated from your metrics storage
  return 1.2; // percentage
}

function calculateThroughput(): number {
  // Calculate requests per minute
  // This would be populated from your metrics storage
  return 45.5;
}

function calculateHealthScore(systemMetrics: any, dbHealth: boolean, performanceStats: any): number {
  let score = 100;
  
  // Deduct points for system issues
  if (systemMetrics.memory.level === 'warning') score -= 10;
  if (systemMetrics.memory.level === 'critical') score -= 25;
  
  // Deduct points for database issues
  if (!dbHealth) score -= 30;
  
  // Deduct points for slow response times
  if (performanceStats.averageResponseTime > 500) score -= 15;
  if (performanceStats.p95ResponseTime > 1000) score -= 10;
  
  return Math.max(0, score);
}