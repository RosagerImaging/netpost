# NetPost Monitoring and Maintenance Setup

## Overview

This directory contains comprehensive monitoring and maintenance configurations for NetPost production deployment. The setup includes error monitoring, performance tracking, health checks, alerting, and operational procedures.

## Components

### 1. Error Monitoring (Sentry)

**Files:**
- `sentry.config.js` - Main Sentry configuration
- `sentry-dashboard.config.js` - Next.js dashboard configuration
- `sentry-backend.config.js` - Vercel serverless functions configuration

**Features:**
- Real-time error tracking
- Performance monitoring
- Session replay (dashboard)
- Release tracking
- User context and breadcrumbs

**Setup:**
```bash
npm install @sentry/nextjs @sentry/node @sentry/profiling-node

# Dashboard (Next.js)
# Add to next.config.js:
const { withSentryConfig } = require('@sentry/nextjs');
const sentryWebpackPluginOptions = require('./monitoring/sentry-dashboard.config.js');

# Environment variables needed:
NEXT_PUBLIC_SENTRY_DSN_DASHBOARD=your_dashboard_dsn
SENTRY_DSN_BACKEND=your_backend_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT_DASHBOARD=netpost-dashboard
SENTRY_PROJECT_BACKEND=netpost-backend
SENTRY_AUTH_TOKEN=your_auth_token
```

### 2. Performance Monitoring

**Files:**
- `performance.config.js` - Performance monitoring configuration and utilities
- `../backend/api/monitoring/metrics.ts` - Metrics collection endpoint
- `../backend/api/monitoring/performance.ts` - Performance testing endpoint

**Features:**
- Response time tracking
- Database performance monitoring
- Memory usage monitoring
- Health score calculation
- Configurable thresholds

**Endpoints:**
- `GET /api/monitoring/metrics` - System metrics
- `GET /api/monitoring/performance` - Performance benchmarks

### 3. Health Check Endpoints

**Files:**
- `../backend/api/health.ts` - Basic health check (existing)
- `../backend/api/monitoring/health/detailed.ts` - Comprehensive health check
- `../backend/api/monitoring/health/ready.ts` - Readiness probe
- `../backend/api/monitoring/health/live.ts` - Liveness probe

**Health Check Types:**
- **Basic** (`/api/health`) - Quick health status
- **Detailed** (`/api/monitoring/health/detailed`) - Comprehensive system health
- **Readiness** (`/api/monitoring/health/ready`) - Kubernetes-style readiness probe
- **Liveness** (`/api/monitoring/health/live`) - Process health verification

### 4. Alerting and Notifications

**Files:**
- `alerting.config.js` - Alert rules and notification configuration
- `../backend/api/monitoring/alerts.ts` - Alert management endpoint

**Features:**
- Configurable alert rules
- Multiple notification channels (Slack, Email, PagerDuty, Webhook)
- Escalation policies
- Maintenance windows
- Cooldown periods

**Supported Channels:**
- Slack webhooks
- Email (SMTP)
- PagerDuty
- Generic webhooks

### 5. Uptime Monitoring

**Files:**
- `uptime-monitoring.config.js` - External uptime monitoring configuration

**Features:**
- Multiple endpoint monitoring
- Geographic distribution support
- SLA tracking
- Integration with third-party services (Pingdom, UptimeRobot)

### 6. Dashboard Configuration

**Files:**
- `dashboard.config.js` - Monitoring dashboard configuration
- `grafana-dashboard.json` - Grafana dashboard template

**Dashboard Features:**
- Real-time metrics visualization
- Health score monitoring
- Performance charts
- Alert management
- Customizable panels

## Environment Variables Required

```bash
# Monitoring API Key
MONITORING_API_KEY=your_secure_monitoring_key

# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN_DASHBOARD=https://...
SENTRY_DSN_BACKEND=https://...
SENTRY_ORG=your_org
SENTRY_PROJECT_DASHBOARD=netpost-dashboard
SENTRY_PROJECT_BACKEND=netpost-backend
SENTRY_AUTH_TOKEN=your_auth_token

# Alert Notifications
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_RECIPIENTS=ops@company.com,admin@company.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#alerts
SLACK_MENTION_USERS=@ops-team

ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com
ALERT_WEBHOOK_SECRET=your_webhook_secret

PAGERDUTY_INTEGRATION_KEY=your_pagerduty_integration_key

# Third-party Monitoring
DATADOG_API_KEY=your_datadog_api_key
NEW_RELIC_LICENSE_KEY=your_newrelic_license_key
PINGDOM_API_KEY=your_pingdom_api_key
UPTIMEROBOT_API_KEY=your_uptimerobot_api_key
```

## Usage

### Starting Monitoring

```javascript
// Import and initialize monitoring
import { initSentry } from './monitoring/sentry-backend.config.js';
import { AlertManager } from './monitoring/alerting.config.js';
import { UptimeMonitor } from './monitoring/uptime-monitoring.config.js';

// Initialize error monitoring
initSentry();

// Start alert monitoring
const alertManager = new AlertManager();

// Start uptime monitoring
const uptimeMonitor = new UptimeMonitor();
uptimeMonitor.start();
```

### API Endpoints

**Health Checks:**
```bash
# Basic health
curl https://your-domain.com/api/health

# Detailed health check
curl https://your-domain.com/api/monitoring/health/detailed

# Readiness probe
curl https://your-domain.com/api/monitoring/health/ready

# Liveness probe
curl https://your-domain.com/api/monitoring/health/live
```

**Metrics and Performance:**
```bash
# System metrics
curl -H "X-Monitoring-Key: your_key" https://your-domain.com/api/monitoring/metrics

# Performance benchmarks
curl https://your-domain.com/api/monitoring/performance
```

**Alert Management:**
```bash
# Get active alerts
curl -H "X-Monitoring-Key: your_key" https://your-domain.com/api/monitoring/alerts

# Trigger manual alert
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Monitoring-Key: your_key" \
  -d '{"ruleId": "high_error_rate", "message": "Manual test"}' \
  https://your-domain.com/api/monitoring/alerts
```

## Integration with External Services

### Grafana Dashboard

1. Import `grafana-dashboard.json` into your Grafana instance
2. Configure Prometheus data source
3. Set up metric collection from `/api/monitoring/metrics`

### Status Page Integration

The monitoring system can integrate with status page services:

```javascript
// Update status page during incidents
await updateStatusPage({
  component: 'api',
  status: 'major_outage',
  message: 'API experiencing high error rates'
});
```

### Slack Integration

Configure Slack webhooks for real-time notifications:

```javascript
// Slack notification example
const slackMessage = {
  text: "🚨 Critical Alert: High error rate detected",
  attachments: [{
    color: "danger",
    fields: [{
      title: "Error Rate",
      value: "12.5%",
      short: true
    }]
  }]
};
```

## Maintenance Procedures

See `../docs/MAINTENANCE_PROCEDURES.md` for detailed maintenance procedures including:
- Weekly maintenance tasks
- Database maintenance
- Security updates
- Backup procedures
- Performance optimization

## Incident Response

See `../docs/INCIDENT_RESPONSE.md` for comprehensive incident response procedures including:
- Incident classification
- Response team structure
- Communication protocols
- Escalation procedures
- Post-incident review process

## Monitoring Best Practices

1. **Set Appropriate Thresholds**: Configure alert thresholds based on historical data
2. **Avoid Alert Fatigue**: Use cooldown periods and escalation policies
3. **Monitor Key User Journeys**: Focus on business-critical paths
4. **Regular Health Checks**: Verify monitoring system health
5. **Documentation**: Keep runbooks and procedures updated
6. **Testing**: Regularly test alert systems and procedures

## Troubleshooting

### Common Issues

**High Memory Usage:**
```bash
# Check memory metrics
curl https://your-domain.com/api/monitoring/metrics | jq '.data.system.memory'

# Check for memory leaks in Sentry
# Monitor heap snapshots and garbage collection
```

**Database Performance:**
```bash
# Check database metrics
curl https://your-domain.com/api/monitoring/performance | jq '.data.database'

# Review slow queries in Supabase dashboard
```

**Alert Not Triggering:**
1. Check alert rule configuration
2. Verify notification channel settings
3. Check maintenance windows
4. Review cooldown periods

### Logs and Debugging

**Enable Debug Logging:**
```bash
# Set environment variable
NODE_ENV=development
# or
DEBUG_MONITORING=true
```

**Check System Health:**
```bash
# Run comprehensive health check
curl -s https://your-domain.com/api/monitoring/health/detailed | jq .
```

## Support and Maintenance

- **Document Owner**: DevOps Team
- **Review Schedule**: Quarterly
- **Last Updated**: [Current Date]
- **Next Review**: [Next Quarter]

For questions or issues with the monitoring setup, contact the DevOps team or create an issue in the project repository.