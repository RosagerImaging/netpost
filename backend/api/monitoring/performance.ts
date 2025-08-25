import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { PerformanceMonitor, performanceConfig } from '../../../monitoring/performance.config';

const performanceMonitor = new PerformanceMonitor();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const timerId = performanceMonitor.startTimer('performance_check');

    // Test database performance
    const dbPerformance = await testDatabasePerformance();
    
    // Test API endpoint performance
    const apiPerformance = await testApiPerformance(req);
    
    // Get current system performance
    const systemPerformance = getSystemPerformance();
    
    // Calculate overall performance score
    const performanceScore = calculatePerformanceScore({
      database: dbPerformance,
      api: apiPerformance,
      system: systemPerformance
    });

    const performanceData = {
      timestamp: new Date().toISOString(),
      overall: {
        score: performanceScore,
        status: getPerformanceStatus(performanceScore),
        responseTime: performanceMonitor.endTimer(timerId)
      },
      database: dbPerformance,
      api: apiPerformance,
      system: systemPerformance,
      thresholds: performanceConfig.thresholds
    };

    const statusCode = performanceScore >= 80 ? 200 : performanceScore >= 60 ? 206 : 503;
    
    res.status(statusCode).json({
      success: performanceScore >= 60,
      data: performanceData
    });

  } catch (error) {
    console.error('Performance check error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Performance check failed',
        code: 'PERFORMANCE_CHECK_ERROR'
      }
    });
  }
}

async function testDatabasePerformance() {
  const timerId = performanceMonitor.startTimer('db_performance_test');
  
  try {
    // Simple database query to test performance
    const startTime = performance.now();
    
    // Simulate database query - replace with actual query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    const queryTime = performance.now() - startTime;
    const result = performanceMonitor.endTimer(timerId);
    
    const thresholds = performanceConfig.thresholds.database;
    const level = performanceMonitor.getPerformanceLevel(queryTime, thresholds);
    
    return {
      queryTime,
      level,
      status: level !== 'critical' ? 'healthy' : 'degraded',
      details: {
        connectionTime: queryTime * 0.3, // Simulated connection time
        executionTime: queryTime * 0.7,  // Simulated execution time
        thresholds
      }
    };
  } catch (error) {
    performanceMonitor.endTimer(timerId);
    return {
      queryTime: -1,
      level: 'critical',
      status: 'unhealthy',
      error: error.message,
      details: {
        connectionTime: -1,
        executionTime: -1,
        thresholds: performanceConfig.thresholds.database
      }
    };
  }
}

async function testApiPerformance(req: VercelRequest) {
  const timerId = performanceMonitor.startTimer('api_performance_test');
  
  try {
    const startTime = performance.now();
    
    // Test internal API performance (health check)
    const healthCheckTime = await testHealthCheckPerformance();
    
    const totalTime = performance.now() - startTime;
    const result = performanceMonitor.endTimer(timerId);
    
    const thresholds = performanceConfig.thresholds.api;
    const level = performanceMonitor.getPerformanceLevel(totalTime, thresholds);
    
    return {
      responseTime: totalTime,
      level,
      status: level !== 'critical' ? 'healthy' : 'degraded',
      endpoints: {
        health: healthCheckTime
      },
      details: {
        thresholds,
        region: req.headers['x-vercel-deployment-url'] || 'unknown'
      }
    };
  } catch (error) {
    performanceMonitor.endTimer(timerId);
    return {
      responseTime: -1,
      level: 'critical',
      status: 'unhealthy',
      error: error.message,
      endpoints: {},
      details: {
        thresholds: performanceConfig.thresholds.api,
        region: 'unknown'
      }
    };
  }
}

async function testHealthCheckPerformance(): Promise<number> {
  const startTime = performance.now();
  
  try {
    // Simulate health check - in real implementation, make actual request
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    return performance.now() - startTime;
  } catch (error) {
    return -1;
  }
}

function getSystemPerformance() {
  const systemMetrics = performanceMonitor.getSystemMetrics();
  const memoryUsageMB = systemMetrics.memory.heapUsedMB;
  const thresholds = performanceConfig.thresholds.memory;
  
  let memoryLevel = 'normal';
  if (memoryUsageMB > thresholds.critical) {
    memoryLevel = 'critical';
  } else if (memoryUsageMB > thresholds.warning) {
    memoryLevel = 'warning';
  }
  
  return {
    memory: {
      used: memoryUsageMB,
      level: memoryLevel,
      status: memoryLevel === 'critical' ? 'unhealthy' : 'healthy',
      thresholds
    },
    uptime: systemMetrics.uptime,
    node: systemMetrics.node,
    environment: systemMetrics.environment
  };
}

function calculatePerformanceScore(metrics: {
  database: any,
  api: any,
  system: any
}): number {
  let score = 100;
  
  // Database performance impact (40% weight)
  if (metrics.database.level === 'critical') score -= 40;
  else if (metrics.database.level === 'slow') score -= 20;
  else if (metrics.database.level === 'acceptable') score -= 10;
  
  // API performance impact (35% weight)
  if (metrics.api.level === 'critical') score -= 35;
  else if (metrics.api.level === 'slow') score -= 18;
  else if (metrics.api.level === 'acceptable') score -= 9;
  
  // System performance impact (25% weight)
  if (metrics.system.memory.level === 'critical') score -= 25;
  else if (metrics.system.memory.level === 'warning') score -= 12;
  
  return Math.max(0, Math.min(100, score));
}

function getPerformanceStatus(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'degraded';
  return 'critical';
}