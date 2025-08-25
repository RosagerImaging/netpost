// Performance monitoring configuration for NetPost
export const performanceConfig = {
  // Performance thresholds
  thresholds: {
    // API response times (ms)
    api: {
      fast: 200,
      acceptable: 500,
      slow: 1000,
      critical: 2000
    },
    
    // Database query times (ms)
    database: {
      fast: 100,
      acceptable: 250,
      slow: 500,
      critical: 1000
    },
    
    // Frontend metrics
    frontend: {
      // Core Web Vitals
      lcp: 2500,  // Largest Contentful Paint
      fid: 100,   // First Input Delay
      cls: 0.1,   // Cumulative Layout Shift
      
      // Additional metrics
      fcp: 1800,  // First Contentful Paint
      ttfb: 600,  // Time to First Byte
      fmp: 2000   // First Meaningful Paint
    },
    
    // Memory usage (MB)
    memory: {
      warning: 400,
      critical: 500
    },
    
    // Error rates (%)
    errorRates: {
      warning: 1,
      critical: 5
    }
  },

  // Monitoring intervals
  intervals: {
    healthCheck: 30000,      // 30 seconds
    metrics: 60000,          // 1 minute
    performance: 300000,     // 5 minutes
    alerts: 300000           // 5 minutes
  },

  // Data retention periods
  retention: {
    metrics: '30d',
    logs: '14d',
    traces: '7d',
    alerts: '90d'
  },

  // Performance tracking endpoints
  endpoints: {
    health: '/api/health',
    metrics: '/api/monitoring/metrics',
    performance: '/api/monitoring/performance',
    alerts: '/api/monitoring/alerts'
  },

  // Third-party integrations
  integrations: {
    datadog: {
      enabled: process.env.DATADOG_API_KEY ? true : false,
      apiKey: process.env.DATADOG_API_KEY,
      service: 'netpost',
      env: process.env.NODE_ENV || 'development',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'
    },
    
    newrelic: {
      enabled: process.env.NEW_RELIC_LICENSE_KEY ? true : false,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: 'NetPost'
    },
    
    pingdom: {
      enabled: process.env.PINGDOM_API_KEY ? true : false,
      apiKey: process.env.PINGDOM_API_KEY,
      checkInterval: 60 // seconds
    }
  }
};

// Performance metrics collection class
export class PerformanceMonitor {
  constructor(config = performanceConfig) {
    this.config = config;
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  // Start timing an operation
  startTimer(operation) {
    const timer = {
      start: performance.now(),
      operation,
      id: `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.metrics.set(timer.id, timer);
    return timer.id;
  }

  // End timing an operation
  endTimer(timerId, metadata = {}) {
    const timer = this.metrics.get(timerId);
    if (!timer) return null;

    const duration = performance.now() - timer.start;
    const result = {
      operation: timer.operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Determine performance level
    const thresholds = this.getThresholds(timer.operation);
    result.level = this.getPerformanceLevel(duration, thresholds);

    // Clean up
    this.metrics.delete(timerId);

    return result;
  }

  // Get appropriate thresholds for operation type
  getThresholds(operation) {
    if (operation.includes('db') || operation.includes('database')) {
      return this.config.thresholds.database;
    } else if (operation.includes('api')) {
      return this.config.thresholds.api;
    }
    return this.config.thresholds.api; // default
  }

  // Determine performance level based on duration and thresholds
  getPerformanceLevel(duration, thresholds) {
    if (duration <= thresholds.fast) return 'fast';
    if (duration <= thresholds.acceptable) return 'acceptable';
    if (duration <= thresholds.slow) return 'slow';
    return 'critical';
  }

  // Get system performance metrics
  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        level: memoryUsage.heapUsed / 1024 / 1024 > this.config.thresholds.memory.critical 
          ? 'critical' 
          : memoryUsage.heapUsed / 1024 / 1024 > this.config.thresholds.memory.warning 
            ? 'warning' 
            : 'normal'
      },
      uptime: {
        seconds: Math.floor(uptime),
        formatted: this.formatUptime(uptime)
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      environment: process.env.NODE_ENV
    };
  }

  formatUptime(uptimeSeconds) {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ') || '0s';
  }
}

export default performanceConfig;