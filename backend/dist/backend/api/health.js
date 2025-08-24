"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../src/middleware/cors");
const database_1 = require("../src/utils/database");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const startTime = performance.now();
        // Check database connectivity
        const dbHealth = await (0, database_1.checkDatabaseHealth)();
        // Basic system checks
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const endTime = performance.now();
        // Get performance metrics (only in development or with admin token)
        const isAdmin = req.headers.authorization?.includes('admin') || false;
        const includeMetrics = process.env.NODE_ENV === 'development' || isAdmin;
        const healthData = {
            status: dbHealth ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            checks: {
                database: {
                    status: dbHealth ? 'pass' : 'fail',
                    responseTime: `${(endTime - startTime).toFixed(2)}ms`
                },
                memory: {
                    status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn', // 500MB threshold
                    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
                    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`
                },
                uptime: {
                    status: 'pass',
                    seconds: Math.floor(uptime),
                    formatted: formatUptime(uptime)
                }
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                nodeEnv: process.env.NODE_ENV
            },
            ...(includeMetrics && {
                performance: {
                    slowQueries: (0, database_1.getQueryMetrics)().slice(-10), // Last 10 slow queries
                    queryCount: (0, database_1.getQueryMetrics)().length
                }
            })
        };
        const statusCode = dbHealth ? 200 : 503;
        res.status(statusCode).json({
            success: dbHealth,
            data: healthData
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            success: false,
            error: {
                message: 'Health check failed',
                code: 'HEALTH_CHECK_ERROR'
            }
        });
    }
}
function formatUptime(uptimeSeconds) {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (seconds > 0)
        parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
}
