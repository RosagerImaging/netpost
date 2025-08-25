"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const alerting_config_1 = require("../../../monitoring/alerting.config");
const performance_config_1 = require("../../../monitoring/performance.config");
const alertManager = new alerting_config_1.AlertManager();
const performanceMonitor = new performance_config_1.PerformanceMonitor();
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    const { method } = req;
    try {
        switch (method) {
            case 'GET':
                return await handleGetAlerts(req, res);
            case 'POST':
                return await handleTriggerAlert(req, res);
            case 'PUT':
                return await handleUpdateAlert(req, res);
            case 'DELETE':
                return await handleDeleteAlert(req, res);
            default:
                res.status(405).json({ success: false, error: 'Method not allowed' });
        }
    }
    catch (error) {
        console.error('Alert endpoint error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Alert operation failed',
                code: 'ALERT_ERROR'
            }
        });
    }
}
async function handleGetAlerts(req, res) {
    const { status, severity, limit = 50 } = req.query;
    // Check authorization
    if (!isAuthorized(req)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    // Get recent alerts from history
    const alerts = getAlertsFromHistory({
        status: status,
        severity: severity,
        limit: parseInt(limit)
    });
    // Get current alert status
    const currentMetrics = await getCurrentMetrics();
    const activeAlerts = checkActiveAlerts(currentMetrics);
    res.status(200).json({
        success: true,
        data: {
            active: activeAlerts,
            recent: alerts,
            config: {
                rules: alerting_config_1.alertingConfig.rules,
                thresholds: alerting_config_1.alertingConfig.thresholds,
                channels: Object.keys(alerting_config_1.alertingConfig.channels).filter(channel => alerting_config_1.alertingConfig.channels[channel].enabled)
            }
        }
    });
}
async function handleTriggerAlert(req, res) {
    const { ruleId, metrics, message } = req.body;
    // Check authorization - only admin or monitoring services can trigger alerts
    if (!isAuthorizedForWrite(req)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    if (!ruleId) {
        res.status(400).json({ success: false, error: 'Rule ID is required' });
        return;
    }
    const rule = alerting_config_1.alertingConfig.rules.find(r => r.id === ruleId);
    if (!rule) {
        res.status(404).json({ success: false, error: 'Alert rule not found' });
        return;
    }
    try {
        const currentMetrics = metrics || await getCurrentMetrics();
        // Force trigger the alert (bypass cooldown for manual triggers)
        const alertSent = await alertManager.sendAlert(rule, {
            ...currentMetrics,
            manualTrigger: true,
            triggerMessage: message
        });
        if (alertSent) {
            res.status(200).json({
                success: true,
                message: `Alert '${rule.name}' triggered successfully`,
                data: {
                    ruleId: rule.id,
                    channels: rule.channels,
                    severity: rule.severity
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to send alert'
            });
        }
    }
    catch (error) {
        console.error('Error triggering alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger alert'
        });
    }
}
async function handleUpdateAlert(req, res) {
    const { ruleId } = req.query;
    const updates = req.body;
    // Check authorization
    if (!isAuthorizedForWrite(req)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    if (!ruleId) {
        res.status(400).json({ success: false, error: 'Rule ID is required' });
        return;
    }
    // In production, this would update the rule in a database
    // For now, just acknowledge the update request
    res.status(200).json({
        success: true,
        message: `Alert rule '${ruleId}' updated`,
        data: {
            ruleId,
            updates
        }
    });
}
async function handleDeleteAlert(req, res) {
    const { ruleId } = req.query;
    // Check authorization
    if (!isAuthorizedForWrite(req)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    if (!ruleId) {
        res.status(400).json({ success: false, error: 'Rule ID is required' });
        return;
    }
    // In production, this would delete the rule from a database
    res.status(200).json({
        success: true,
        message: `Alert rule '${ruleId}' deleted`
    });
}
async function getCurrentMetrics() {
    const systemMetrics = performanceMonitor.getSystemMetrics();
    // Simulate some metrics - in production, get from monitoring system
    return {
        errorRate: Math.random() * 10, // 0-10%
        responseTime: 200 + Math.random() * 800, // 200-1000ms
        dbResponseTime: 50 + Math.random() * 200, // 50-250ms
        memoryUsage: systemMetrics.memory.heapUsedMB,
        healthScore: 85 + Math.random() * 15, // 85-100
        uptime: 99.95,
        timestamp: new Date().toISOString()
    };
}
function checkActiveAlerts(metrics) {
    const activeAlerts = [];
    for (const rule of alerting_config_1.alertingConfig.rules) {
        if (alertManager.shouldAlert(rule, metrics)) {
            activeAlerts.push({
                id: rule.id,
                name: rule.name,
                severity: rule.severity,
                condition: rule.condition,
                triggered: new Date().toISOString(),
                metrics: {
                    current: metrics,
                    threshold: getThresholdForRule(rule)
                }
            });
        }
    }
    return activeAlerts;
}
function getThresholdForRule(rule) {
    // Extract threshold from rule condition
    // This is a simplified implementation
    const condition = rule.condition;
    const match = condition.match(/(\w+)\s*>\s*(\d+)/);
    if (match) {
        const [, metric, threshold] = match;
        return { metric, threshold: parseFloat(threshold) };
    }
    return null;
}
function getAlertsFromHistory(filters) {
    // In production, this would query a database or logging system
    // For now, return mock data
    return [
        {
            id: 'alert_001',
            ruleId: 'high_error_rate',
            name: 'High Error Rate',
            severity: 'warning',
            triggered: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            resolved: new Date(Date.now() - 3300000).toISOString(), // 55 minutes ago
            status: 'resolved',
            duration: '5 minutes'
        },
        {
            id: 'alert_002',
            ruleId: 'slow_response_time',
            name: 'Slow Response Time',
            severity: 'warning',
            triggered: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            status: 'active',
            duration: '30 minutes'
        }
    ].slice(0, filters.limit);
}
function isAuthorized(req) {
    const authHeader = req.headers.authorization;
    const monitoringKey = req.headers['x-monitoring-key'];
    return (authHeader?.includes('admin') ||
        monitoringKey === process.env.MONITORING_API_KEY ||
        process.env.NODE_ENV === 'development');
}
function isAuthorizedForWrite(req) {
    const authHeader = req.headers.authorization;
    return (authHeader?.includes('admin') ||
        process.env.NODE_ENV === 'development');
}
