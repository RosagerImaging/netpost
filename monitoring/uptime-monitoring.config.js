// Uptime monitoring configuration for external services
export const uptimeConfig = {
  // Service endpoints to monitor
  endpoints: [
    {
      id: 'api-health',
      name: 'API Health Check',
      url: 'https://your-domain.com/api/health',
      method: 'GET',
      timeout: 10000,
      expectedStatus: 200,
      expectedResponseTime: 2000,
      interval: 60000, // 1 minute
      retries: 3,
      enabled: true,
      critical: true
    },
    {
      id: 'dashboard-home',
      name: 'Dashboard Home Page',
      url: 'https://your-domain.com',
      method: 'GET',
      timeout: 15000,
      expectedStatus: 200,
      expectedResponseTime: 3000,
      interval: 300000, // 5 minutes
      retries: 2,
      enabled: true,
      critical: true
    },
    {
      id: 'api-auth-login',
      name: 'Authentication API',
      url: 'https://your-domain.com/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'invalid'
      }),
      timeout: 10000,
      expectedStatus: [401, 400], // Expecting authentication failure
      expectedResponseTime: 2000,
      interval: 300000, // 5 minutes
      retries: 3,
      enabled: true,
      critical: true
    },
    {
      id: 'api-inventory-list',
      name: 'Inventory API',
      url: 'https://your-domain.com/api/inventory/list',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      },
      timeout: 10000,
      expectedStatus: [401, 403], // Expecting unauthorized
      expectedResponseTime: 2000,
      interval: 300000, // 5 minutes
      retries: 3,
      enabled: true,
      critical: false
    },
    {
      id: 'detailed-health',
      name: 'Detailed Health Check',
      url: 'https://your-domain.com/api/monitoring/health/detailed',
      method: 'GET',
      timeout: 15000,
      expectedStatus: 200,
      expectedResponseTime: 5000,
      interval: 300000, // 5 minutes
      retries: 2,
      enabled: true,
      critical: false,
      validateResponse: (response) => {
        try {
          const data = JSON.parse(response.body);
          return data.data && data.data.score >= 60;
        } catch (error) {
          return false;
        }
      }
    }
  ],

  // Geographic monitoring locations
  locations: [
    {
      id: 'us-east',
      name: 'US East (Virginia)',
      enabled: true,
      weight: 1.0
    },
    {
      id: 'us-west',
      name: 'US West (California)',
      enabled: true,
      weight: 1.0
    },
    {
      id: 'eu-west',
      name: 'Europe West (Ireland)',
      enabled: true,
      weight: 0.8
    },
    {
      id: 'asia-southeast',
      name: 'Asia Southeast (Singapore)',
      enabled: false, // Disabled for now
      weight: 0.5
    }
  ],

  // Uptime calculation settings
  uptime: {
    slaTarget: 99.9, // 99.9% uptime target
    calculationWindow: '30d', // 30-day rolling window
    maintenanceWindows: [
      {
        name: 'Weekly Maintenance',
        schedule: 'sunday 02:00-04:00 UTC',
        excludeFromSla: true
      }
    ]
  },

  // Notification settings
  notifications: {
    downAlert: {
      enabled: true,
      channels: ['slack', 'email'],
      threshold: 2, // Alert after 2 consecutive failures
      cooldown: 300000 // 5 minutes
    },
    recoveryAlert: {
      enabled: true,
      channels: ['slack'],
      message: 'Service recovered'
    },
    performanceAlert: {
      enabled: true,
      channels: ['slack'],
      threshold: 5000, // Alert if response time > 5 seconds
      cooldown: 600000 // 10 minutes
    }
  },

  // Third-party service integrations
  integrations: {
    pingdom: {
      enabled: process.env.PINGDOM_API_KEY ? true : false,
      apiKey: process.env.PINGDOM_API_KEY,
      username: process.env.PINGDOM_USERNAME,
      password: process.env.PINGDOM_PASSWORD,
      accountEmail: process.env.PINGDOM_ACCOUNT_EMAIL
    },
    uptimerobot: {
      enabled: process.env.UPTIMEROBOT_API_KEY ? true : false,
      apiKey: process.env.UPTIMEROBOT_API_KEY
    },
    statuspage: {
      enabled: process.env.STATUSPAGE_API_KEY ? true : false,
      apiKey: process.env.STATUSPAGE_API_KEY,
      pageId: process.env.STATUSPAGE_PAGE_ID
    }
  }
};

// Uptime monitoring class
export class UptimeMonitor {
  constructor(config = uptimeConfig) {
    this.config = config;
    this.monitors = new Map();
    this.results = new Map();
  }

  // Start monitoring all endpoints
  start() {
    this.config.endpoints.forEach(endpoint => {
      if (endpoint.enabled) {
        this.startMonitoring(endpoint);
      }
    });
  }

  // Start monitoring a specific endpoint
  startMonitoring(endpoint) {
    if (this.monitors.has(endpoint.id)) {
      clearInterval(this.monitors.get(endpoint.id));
    }

    const monitor = setInterval(async () => {
      await this.checkEndpoint(endpoint);
    }, endpoint.interval);

    this.monitors.set(endpoint.id, monitor);
    
    // Initial check
    this.checkEndpoint(endpoint);
  }

  // Stop monitoring
  stop() {
    this.monitors.forEach((monitor, endpointId) => {
      clearInterval(monitor);
      this.monitors.delete(endpointId);
    });
  }

  // Check a specific endpoint
  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;

    while (attempt <= endpoint.retries) {
      try {
        const result = await this.performCheck(endpoint);
        const responseTime = Date.now() - startTime;

        const checkResult = {
          endpointId: endpoint.id,
          timestamp: new Date().toISOString(),
          success: result.success,
          responseTime,
          statusCode: result.statusCode,
          error: result.error,
          attempt: attempt + 1,
          location: 'local' // Would be actual location in distributed setup
        };

        this.recordResult(endpoint.id, checkResult);

        if (result.success) {
          if (responseTime > endpoint.expectedResponseTime) {
            await this.handleSlowResponse(endpoint, checkResult);
          }
          await this.handleSuccess(endpoint, checkResult);
          return;
        } else {
          lastError = result.error;
          if (attempt < endpoint.retries) {
            await this.delay(1000 * (attempt + 1)); // Exponential backoff
          }
        }
      } catch (error) {
        lastError = error.message;
        if (attempt < endpoint.retries) {
          await this.delay(1000 * (attempt + 1));
        }
      }
      attempt++;
    }

    // All attempts failed
    const checkResult = {
      endpointId: endpoint.id,
      timestamp: new Date().toISOString(),
      success: false,
      responseTime: Date.now() - startTime,
      error: lastError,
      attempt: attempt,
      location: 'local'
    };

    this.recordResult(endpoint.id, checkResult);
    await this.handleFailure(endpoint, checkResult);
  }

  // Perform the actual HTTP check
  async performCheck(endpoint) {
    try {
      const options = {
        method: endpoint.method,
        timeout: endpoint.timeout,
        headers: endpoint.headers || {}
      };

      if (endpoint.body) {
        options.body = endpoint.body;
      }

      // In a real implementation, use fetch or axios
      // Simulating the check for now
      const response = await this.simulateHttpRequest(endpoint, options);

      const isValidStatus = Array.isArray(endpoint.expectedStatus)
        ? endpoint.expectedStatus.includes(response.status)
        : response.status === endpoint.expectedStatus;

      let isValidResponse = true;
      if (endpoint.validateResponse && response.ok) {
        isValidResponse = endpoint.validateResponse(response);
      }

      return {
        success: isValidStatus && isValidResponse,
        statusCode: response.status,
        error: isValidStatus && isValidResponse ? null : `Status: ${response.status}, Valid: ${isValidResponse}`
      };
    } catch (error) {
      return {
        success: false,
        statusCode: null,
        error: error.message
      };
    }
  }

  // Simulate HTTP request (replace with actual implementation)
  async simulateHttpRequest(endpoint, options) {
    // Simulate network delay
    await this.delay(Math.random() * 200 + 100);

    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Network timeout');
    }

    // Simulate different response codes based on endpoint
    let status = 200;
    if (endpoint.url.includes('/auth/login') && endpoint.method === 'POST') {
      status = 401; // Expected for invalid credentials
    }

    return {
      status,
      ok: status >= 200 && status < 300,
      body: JSON.stringify({ success: true, timestamp: new Date().toISOString() })
    };
  }

  // Record check result
  recordResult(endpointId, result) {
    if (!this.results.has(endpointId)) {
      this.results.set(endpointId, []);
    }

    const results = this.results.get(endpointId);
    results.push(result);

    // Keep only last 1000 results per endpoint
    if (results.length > 1000) {
      results.splice(0, results.length - 1000);
    }
  }

  // Handle successful check
  async handleSuccess(endpoint, result) {
    const previousResults = this.getRecentResults(endpoint.id, 3);
    const wasDown = previousResults.some(r => !r.success);

    if (wasDown) {
      await this.sendRecoveryAlert(endpoint, result);
    }
  }

  // Handle failed check
  async handleFailure(endpoint, result) {
    const recentFailures = this.getRecentFailures(endpoint.id);
    
    if (recentFailures >= this.config.notifications.downAlert.threshold) {
      await this.sendDownAlert(endpoint, result);
    }
  }

  // Handle slow response
  async handleSlowResponse(endpoint, result) {
    if (result.responseTime > this.config.notifications.performanceAlert.threshold) {
      await this.sendPerformanceAlert(endpoint, result);
    }
  }

  // Get recent results for an endpoint
  getRecentResults(endpointId, count = 10) {
    const results = this.results.get(endpointId) || [];
    return results.slice(-count);
  }

  // Get count of recent consecutive failures
  getRecentFailures(endpointId) {
    const results = this.getRecentResults(endpointId, 10);
    let failures = 0;
    
    for (let i = results.length - 1; i >= 0; i--) {
      if (!results[i].success) {
        failures++;
      } else {
        break;
      }
    }
    
    return failures;
  }

  // Calculate uptime percentage
  calculateUptime(endpointId, timeWindow = '24h') {
    const results = this.results.get(endpointId) || [];
    if (results.length === 0) return 100;

    const windowStart = this.getWindowStart(timeWindow);
    const relevantResults = results.filter(r => new Date(r.timestamp) >= windowStart);

    if (relevantResults.length === 0) return 100;

    const successfulChecks = relevantResults.filter(r => r.success).length;
    return (successfulChecks / relevantResults.length) * 100;
  }

  // Get start time for calculation window
  getWindowStart(timeWindow) {
    const now = new Date();
    switch (timeWindow) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  // Send alerts (placeholder implementations)
  async sendDownAlert(endpoint, result) {
    console.log(`🚨 DOWN ALERT: ${endpoint.name} is down`, result);
    // Implementation would send actual alerts
  }

  async sendRecoveryAlert(endpoint, result) {
    console.log(`✅ RECOVERY: ${endpoint.name} is back up`, result);
    // Implementation would send actual alerts
  }

  async sendPerformanceAlert(endpoint, result) {
    console.log(`⚠️ PERFORMANCE: ${endpoint.name} is slow (${result.responseTime}ms)`, result);
    // Implementation would send actual alerts
  }

  // Utility function for delays
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get monitoring status for all endpoints
  getStatus() {
    const status = {};
    
    this.config.endpoints.forEach(endpoint => {
      const recentResults = this.getRecentResults(endpoint.id, 5);
      const uptime24h = this.calculateUptime(endpoint.id, '24h');
      const uptime7d = this.calculateUptime(endpoint.id, '7d');
      
      const lastResult = recentResults[recentResults.length - 1];
      
      status[endpoint.id] = {
        name: endpoint.name,
        url: endpoint.url,
        status: lastResult?.success ? 'up' : 'down',
        uptime: {
          '24h': uptime24h,
          '7d': uptime7d
        },
        lastCheck: lastResult?.timestamp,
        responseTime: lastResult?.responseTime,
        consecutiveFailures: this.getRecentFailures(endpoint.id)
      };
    });
    
    return status;
  }
}

export default uptimeConfig;