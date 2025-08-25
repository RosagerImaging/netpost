// Alerting and notification configuration for NetPost
export const alertingConfig = {
  // Alert thresholds
  thresholds: {
    // Response time alerts (ms)
    responseTime: {
      warning: 1000,
      critical: 2000
    },
    
    // Error rate alerts (%)
    errorRate: {
      warning: 5,
      critical: 10
    },
    
    // Database performance alerts (ms)
    databaseResponseTime: {
      warning: 500,
      critical: 1000
    },
    
    // Memory usage alerts (MB)
    memoryUsage: {
      warning: 400,
      critical: 500
    },
    
    // Uptime alerts
    uptime: {
      critical: 99.9 // Below 99.9% uptime triggers alert
    },
    
    // Health score alerts
    healthScore: {
      warning: 80,
      critical: 60
    }
  },

  // Alert channels configuration
  channels: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    },
    
    slack: {
      enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts',
      mentionUsers: process.env.SLACK_MENTION_USERS?.split(',') || []
    },
    
    webhook: {
      enabled: process.env.ALERT_WEBHOOK_URL ? true : false,
      url: process.env.ALERT_WEBHOOK_URL,
      secret: process.env.ALERT_WEBHOOK_SECRET,
      timeout: 10000
    },
    
    pagerduty: {
      enabled: process.env.PAGERDUTY_INTEGRATION_KEY ? true : false,
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
      serviceKey: process.env.PAGERDUTY_SERVICE_KEY
    }
  },

  // Alert rules
  rules: [
    {
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds threshold',
      condition: 'errorRate > 5',
      severity: 'warning',
      channels: ['slack', 'email'],
      cooldown: 300000, // 5 minutes
      enabled: true
    },
    {
      id: 'critical_error_rate',
      name: 'Critical Error Rate',
      description: 'Error rate critically high',
      condition: 'errorRate > 10',
      severity: 'critical',
      channels: ['slack', 'email', 'pagerduty'],
      cooldown: 180000, // 3 minutes
      enabled: true
    },
    {
      id: 'slow_response_time',
      name: 'Slow Response Time',
      description: 'API response time is slow',
      condition: 'responseTime > 1000',
      severity: 'warning',
      channels: ['slack'],
      cooldown: 600000, // 10 minutes
      enabled: true
    },
    {
      id: 'database_performance',
      name: 'Database Performance Issue',
      description: 'Database queries are slow',
      condition: 'dbResponseTime > 500',
      severity: 'warning',
      channels: ['slack', 'email'],
      cooldown: 300000, // 5 minutes
      enabled: true
    },
    {
      id: 'memory_usage_high',
      name: 'High Memory Usage',
      description: 'Memory usage is critically high',
      condition: 'memoryUsage > 500',
      severity: 'critical',
      channels: ['slack', 'email'],
      cooldown: 300000, // 5 minutes
      enabled: true
    },
    {
      id: 'health_score_low',
      name: 'Low Health Score',
      description: 'Overall system health is degraded',
      condition: 'healthScore < 80',
      severity: 'warning',
      channels: ['slack'],
      cooldown: 600000, // 10 minutes
      enabled: true
    },
    {
      id: 'service_down',
      name: 'Service Down',
      description: 'Critical service is unavailable',
      condition: 'healthScore < 60',
      severity: 'critical',
      channels: ['slack', 'email', 'pagerduty'],
      cooldown: 0, // No cooldown for critical service issues
      enabled: true
    }
  ],

  // Escalation policies
  escalation: {
    policies: [
      {
        id: 'default',
        name: 'Default Escalation',
        steps: [
          {
            delay: 0,
            channels: ['slack']
          },
          {
            delay: 300000, // 5 minutes
            channels: ['email']
          },
          {
            delay: 900000, // 15 minutes
            channels: ['pagerduty']
          }
        ]
      },
      {
        id: 'critical',
        name: 'Critical Escalation',
        steps: [
          {
            delay: 0,
            channels: ['slack', 'email', 'pagerduty']
          },
          {
            delay: 300000, // 5 minutes
            channels: ['webhook']
          }
        ]
      }
    ]
  },

  // Maintenance windows
  maintenanceWindows: {
    // Define maintenance windows to suppress alerts
    weekly: [
      {
        day: 'sunday',
        start: '02:00',
        end: '04:00',
        timezone: 'UTC',
        description: 'Weekly maintenance window'
      }
    ],
    
    // Ad-hoc maintenance windows
    scheduled: []
  }
};

// Alert manager class
export class AlertManager {
  constructor(config = alertingConfig) {
    this.config = config;
    this.alertHistory = new Map();
    this.suppressions = new Set();
  }

  // Check if alert should be triggered
  shouldAlert(rule, metrics) {
    // Check if rule is enabled
    if (!rule.enabled) return false;

    // Check maintenance windows
    if (this.isInMaintenanceWindow()) return false;

    // Check cooldown period
    if (this.isInCooldown(rule.id)) return false;

    // Evaluate condition
    return this.evaluateCondition(rule.condition, metrics);
  }

  // Evaluate alert condition
  evaluateCondition(condition, metrics) {
    try {
      // Simple condition evaluation - in production, use a proper expression evaluator
      const expressions = {
        errorRate: metrics.errorRate || 0,
        responseTime: metrics.responseTime || 0,
        dbResponseTime: metrics.dbResponseTime || 0,
        memoryUsage: metrics.memoryUsage || 0,
        healthScore: metrics.healthScore || 100
      };

      // Replace variables in condition
      let evaluableCondition = condition;
      Object.entries(expressions).forEach(([key, value]) => {
        evaluableCondition = evaluableCondition.replace(key, value);
      });

      // Evaluate the condition (be careful with eval in production)
      return eval(evaluableCondition);
    } catch (error) {
      console.error('Error evaluating alert condition:', error);
      return false;
    }
  }

  // Send alert through configured channels
  async sendAlert(rule, metrics) {
    const alert = {
      id: `${rule.id}_${Date.now()}`,
      rule,
      metrics,
      timestamp: new Date().toISOString(),
      severity: rule.severity
    };

    const promises = rule.channels.map(channelName => {
      const channel = this.config.channels[channelName];
      if (!channel || !channel.enabled) return Promise.resolve();

      switch (channelName) {
        case 'slack':
          return this.sendSlackAlert(alert, channel);
        case 'email':
          return this.sendEmailAlert(alert, channel);
        case 'webhook':
          return this.sendWebhookAlert(alert, channel);
        case 'pagerduty':
          return this.sendPagerDutyAlert(alert, channel);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.allSettled(promises);
      
      // Record alert in history
      this.alertHistory.set(rule.id, {
        lastTriggered: Date.now(),
        count: (this.alertHistory.get(rule.id)?.count || 0) + 1
      });

      return true;
    } catch (error) {
      console.error('Error sending alert:', error);
      return false;
    }
  }

  // Check if currently in maintenance window
  isInMaintenanceWindow() {
    const now = new Date();
    const currentDay = now.toLocaleLowerCase().substring(0, 3); // sun, mon, etc.
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check weekly maintenance windows
    for (const window of this.config.maintenanceWindows.weekly) {
      if (window.day.startsWith(currentDay)) {
        if (currentTime >= window.start && currentTime <= window.end) {
          return true;
        }
      }
    }

    // Check scheduled maintenance windows
    for (const window of this.config.maintenanceWindows.scheduled) {
      const start = new Date(window.start);
      const end = new Date(window.end);
      if (now >= start && now <= end) {
        return true;
      }
    }

    return false;
  }

  // Check if alert is in cooldown period
  isInCooldown(ruleId) {
    const history = this.alertHistory.get(ruleId);
    if (!history) return false;

    const rule = this.config.rules.find(r => r.id === ruleId);
    if (!rule || !rule.cooldown) return false;

    return (Date.now() - history.lastTriggered) < rule.cooldown;
  }

  // Placeholder methods for different notification channels
  async sendSlackAlert(alert, channel) {
    // Implementation would make HTTP request to Slack webhook
    console.log('Sending Slack alert:', alert.rule.name);
  }

  async sendEmailAlert(alert, channel) {
    // Implementation would send email using SMTP
    console.log('Sending email alert:', alert.rule.name);
  }

  async sendWebhookAlert(alert, channel) {
    // Implementation would send HTTP POST to webhook URL
    console.log('Sending webhook alert:', alert.rule.name);
  }

  async sendPagerDutyAlert(alert, channel) {
    // Implementation would send alert to PagerDuty
    console.log('Sending PagerDuty alert:', alert.rule.name);
  }
}

export default alertingConfig;