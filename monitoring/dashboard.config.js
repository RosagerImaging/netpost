// Monitoring dashboard configuration for NetPost
export const dashboardConfig = {
  // Dashboard layout configuration
  layout: {
    refreshInterval: 30000, // 30 seconds
    autoRefresh: true,
    theme: 'dark',
    timezone: 'UTC'
  },

  // Dashboard panels configuration
  panels: [
    {
      id: 'health-overview',
      title: 'System Health Overview',
      type: 'status',
      size: 'large',
      position: { row: 0, col: 0, width: 12, height: 4 },
      dataSource: '/api/monitoring/health/detailed',
      refreshInterval: 30000,
      config: {
        showScore: true,
        showComponents: true,
        alertThreshold: 80
      }
    },
    
    {
      id: 'response-time',
      title: 'API Response Time',
      type: 'line-chart',
      size: 'medium',
      position: { row: 1, col: 0, width: 6, height: 6 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 60000,
      config: {
        metrics: ['api.averageResponseTime', 'api.p95ResponseTime', 'api.p99ResponseTime'],
        timeRange: '1h',
        yAxis: {
          label: 'Response Time (ms)',
          min: 0,
          max: 'auto'
        },
        thresholds: [
          { value: 500, color: 'yellow', label: 'Warning' },
          { value: 1000, color: 'red', label: 'Critical' }
        ]
      }
    },

    {
      id: 'error-rate',
      title: 'Error Rate',
      type: 'area-chart',
      size: 'medium',
      position: { row: 1, col: 6, width: 6, height: 6 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 60000,
      config: {
        metrics: ['api.errorRate'],
        timeRange: '1h',
        yAxis: {
          label: 'Error Rate (%)',
          min: 0,
          max: 20
        },
        thresholds: [
          { value: 5, color: 'yellow', label: 'Warning' },
          { value: 10, color: 'red', label: 'Critical' }
        ],
        fill: true,
        color: '#ff6b6b'
      }
    },

    {
      id: 'throughput',
      title: 'Request Throughput',
      type: 'line-chart',
      size: 'medium',
      position: { row: 2, col: 0, width: 6, height: 6 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 60000,
      config: {
        metrics: ['api.throughput'],
        timeRange: '1h',
        yAxis: {
          label: 'Requests/min',
          min: 0
        }
      }
    },

    {
      id: 'database-performance',
      title: 'Database Performance',
      type: 'multi-metric',
      size: 'medium',
      position: { row: 2, col: 6, width: 6, height: 6 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 60000,
      config: {
        metrics: [
          {
            name: 'Query Response Time',
            key: 'database.queryStats.averageResponseTime',
            unit: 'ms',
            threshold: { warning: 250, critical: 500 }
          },
          {
            name: 'Active Connections',
            key: 'database.connectionPool.activeConnections',
            unit: 'count',
            threshold: { warning: 8, critical: 10 }
          },
          {
            name: 'Slow Queries',
            key: 'database.queryStats.slow',
            unit: 'count',
            threshold: { warning: 5, critical: 10 }
          }
        ]
      }
    },

    {
      id: 'memory-usage',
      title: 'Memory Usage',
      type: 'gauge',
      size: 'small',
      position: { row: 3, col: 0, width: 3, height: 4 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 30000,
      config: {
        metric: 'system.memory.heapUsedMB',
        max: 512,
        unit: 'MB',
        thresholds: [
          { value: 300, color: 'green' },
          { value: 400, color: 'yellow' },
          { value: 500, color: 'red' }
        ]
      }
    },

    {
      id: 'active-alerts',
      title: 'Active Alerts',
      type: 'alert-list',
      size: 'small',
      position: { row: 3, col: 3, width: 3, height: 4 },
      dataSource: '/api/monitoring/alerts?status=active',
      refreshInterval: 30000,
      config: {
        maxItems: 5,
        showSeverity: true,
        showTimestamp: true
      }
    },

    {
      id: 'uptime',
      title: 'Service Uptime',
      type: 'uptime-chart',
      size: 'medium',
      position: { row: 3, col: 6, width: 6, height: 4 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 300000, // 5 minutes
      config: {
        timeRange: '24h',
        incidents: true,
        target: 99.9
      }
    },

    {
      id: 'geo-distribution',
      title: 'Request Distribution',
      type: 'world-map',
      size: 'large',
      position: { row: 4, col: 0, width: 12, height: 6 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 300000,
      config: {
        metric: 'api.requestsByRegion',
        heatmap: true,
        showValues: true
      }
    },

    {
      id: 'recent-deployments',
      title: 'Recent Deployments',
      type: 'timeline',
      size: 'medium',
      position: { row: 5, col: 0, width: 6, height: 4 },
      dataSource: '/api/monitoring/deployments',
      refreshInterval: 300000,
      config: {
        maxItems: 10,
        showStatus: true,
        showCommit: true
      }
    },

    {
      id: 'key-metrics-summary',
      title: 'Key Metrics Summary',
      type: 'metrics-grid',
      size: 'medium',
      position: { row: 5, col: 6, width: 6, height: 4 },
      dataSource: '/api/monitoring/metrics',
      refreshInterval: 60000,
      config: {
        metrics: [
          { 
            name: 'Health Score', 
            key: 'performance.healthScore', 
            unit: '/100',
            format: 'percentage'
          },
          { 
            name: 'Avg Response Time', 
            key: 'api.averageResponseTime', 
            unit: 'ms'
          },
          { 
            name: 'Total Users', 
            key: 'users.total', 
            unit: 'count'
          },
          { 
            name: 'Active Sessions', 
            key: 'users.activeSessions', 
            unit: 'count'
          }
        ]
      }
    }
  ],

  // Alert configuration for dashboard
  alerts: {
    enabled: true,
    sound: true,
    desktop: true,
    rules: [
      {
        condition: 'healthScore < 60',
        severity: 'critical',
        message: 'System health critically low'
      },
      {
        condition: 'errorRate > 10',
        severity: 'critical',
        message: 'High error rate detected'
      },
      {
        condition: 'responseTime > 2000',
        severity: 'warning',
        message: 'Response time very slow'
      }
    ]
  },

  // Data source configurations
  dataSources: {
    primary: {
      baseUrl: process.env.MONITORING_API_BASE_URL || '',
      timeout: 10000,
      retries: 3,
      headers: {
        'X-Monitoring-Key': process.env.MONITORING_API_KEY
      }
    }
  },

  // Export configurations
  exports: {
    enabled: true,
    formats: ['png', 'pdf', 'json'],
    schedules: [
      {
        name: 'daily-report',
        format: 'pdf',
        schedule: '0 9 * * *', // Daily at 9 AM
        panels: ['health-overview', 'response-time', 'error-rate'],
        recipients: ['ops-team@company.com']
      },
      {
        name: 'weekly-summary',
        format: 'pdf',
        schedule: '0 9 * * 1', // Mondays at 9 AM
        panels: 'all',
        recipients: ['management@company.com']
      }
    ]
  }
};

// Dashboard themes
export const themes = {
  dark: {
    background: '#1a1a1a',
    panel: '#2d2d2d',
    text: '#ffffff',
    border: '#404040',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  },
  
  light: {
    background: '#ffffff',
    panel: '#f5f5f5',
    text: '#333333',
    border: '#dddddd',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  }
};

// Widget types configuration
export const widgetTypes = {
  'status': {
    component: 'StatusWidget',
    defaultSize: { width: 4, height: 2 },
    configSchema: {
      showScore: 'boolean',
      showComponents: 'boolean',
      alertThreshold: 'number'
    }
  },
  
  'line-chart': {
    component: 'LineChartWidget',
    defaultSize: { width: 6, height: 4 },
    configSchema: {
      metrics: 'array',
      timeRange: 'string',
      yAxis: 'object',
      thresholds: 'array'
    }
  },
  
  'area-chart': {
    component: 'AreaChartWidget',
    defaultSize: { width: 6, height: 4 },
    configSchema: {
      metrics: 'array',
      timeRange: 'string',
      yAxis: 'object',
      thresholds: 'array',
      fill: 'boolean'
    }
  },
  
  'gauge': {
    component: 'GaugeWidget',
    defaultSize: { width: 3, height: 3 },
    configSchema: {
      metric: 'string',
      max: 'number',
      unit: 'string',
      thresholds: 'array'
    }
  },
  
  'alert-list': {
    component: 'AlertListWidget',
    defaultSize: { width: 4, height: 3 },
    configSchema: {
      maxItems: 'number',
      showSeverity: 'boolean',
      showTimestamp: 'boolean'
    }
  },
  
  'metrics-grid': {
    component: 'MetricsGridWidget',
    defaultSize: { width: 4, height: 3 },
    configSchema: {
      metrics: 'array'
    }
  },
  
  'uptime-chart': {
    component: 'UptimeChartWidget',
    defaultSize: { width: 6, height: 3 },
    configSchema: {
      timeRange: 'string',
      incidents: 'boolean',
      target: 'number'
    }
  },
  
  'world-map': {
    component: 'WorldMapWidget',
    defaultSize: { width: 8, height: 6 },
    configSchema: {
      metric: 'string',
      heatmap: 'boolean',
      showValues: 'boolean'
    }
  }
};

export default dashboardConfig;