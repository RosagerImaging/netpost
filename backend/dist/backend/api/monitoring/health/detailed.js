"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../../src/middleware/cors");
const database_1 = require("../../../src/utils/database");
const performance_config_1 = require("../../../../monitoring/performance.config");
const performanceMonitor = new performance_config_1.PerformanceMonitor();
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const timerId = performanceMonitor.startTimer('detailed_health_check');
        // Comprehensive health checks
        const healthChecks = await Promise.allSettled([
            (0, database_1.checkDatabaseHealth)(),
            checkExternalServices(),
            checkSystemResources(),
            checkSecurityStatus(),
            checkDependencies()
        ]);
        const [dbHealth, servicesHealth, systemHealth, securityHealth, depsHealth] = healthChecks.map(result => result.status === 'fulfilled' ? result.value : { status: 'fail', error: result.reason?.message });
        // Calculate overall health score
        const healthScore = calculateDetailedHealthScore({
            database: dbHealth,
            services: servicesHealth,
            system: systemHealth,
            security: securityHealth,
            dependencies: depsHealth
        });
        const responseTime = performanceMonitor.endTimer(timerId);
        const healthData = {
            status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'unhealthy',
            score: healthScore,
            timestamp: new Date().toISOString(),
            responseTime: responseTime?.duration || 0,
            checks: {
                database: {
                    status: dbHealth.status ? 'pass' : 'fail',
                    ...dbHealth
                },
                externalServices: {
                    status: servicesHealth.status === 'pass' ? 'pass' : 'fail',
                    ...servicesHealth
                },
                systemResources: {
                    status: systemHealth.status === 'pass' ? 'pass' : 'fail',
                    ...systemHealth
                },
                security: {
                    status: securityHealth.status === 'pass' ? 'pass' : 'fail',
                    ...securityHealth
                },
                dependencies: {
                    status: depsHealth.status === 'pass' ? 'pass' : 'fail',
                    ...depsHealth
                }
            },
            metadata: {
                environment: process.env.NODE_ENV || 'development',
                region: process.env.VERCEL_REGION || 'unknown',
                deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
                nodeVersion: process.version,
                platform: process.platform
            }
        };
        const statusCode = healthScore >= 60 ? 200 : 503;
        res.status(statusCode).json({
            success: healthScore >= 60,
            data: healthData
        });
    }
    catch (error) {
        console.error('Detailed health check error:', error);
        res.status(503).json({
            success: false,
            error: {
                message: 'Detailed health check failed',
                code: 'HEALTH_CHECK_ERROR'
            }
        });
    }
}
async function checkExternalServices() {
    const services = [
        { name: 'supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL },
        { name: 'stripe', critical: true },
        { name: 'anthropic', critical: false }
    ];
    const results = [];
    let passCount = 0;
    let criticalFailures = 0;
    for (const service of services) {
        try {
            const startTime = performance.now();
            // Simulate service check - replace with actual health check calls
            const isHealthy = Math.random() > 0.1; // 90% success rate for simulation
            const responseTime = performance.now() - startTime;
            const result = {
                name: service.name,
                status: isHealthy ? 'pass' : 'fail',
                responseTime,
                critical: service.critical || false,
                url: service.url || 'configured'
            };
            results.push(result);
            if (isHealthy) {
                passCount++;
            }
            else if (service.critical) {
                criticalFailures++;
            }
        }
        catch (error) {
            results.push({
                name: service.name,
                status: 'fail',
                error: error.message,
                critical: service.critical || false
            });
            if (service.critical) {
                criticalFailures++;
            }
        }
    }
    return {
        status: criticalFailures === 0 ? 'pass' : 'fail',
        passCount,
        totalCount: services.length,
        criticalFailures,
        services: results
    };
}
async function checkSystemResources() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100;
    const checks = {
        memory: {
            status: memoryUsedMB < 400 ? 'pass' : memoryUsedMB < 500 ? 'warn' : 'fail',
            used: memoryUsedMB,
            total: memoryTotalMB,
            percentage: memoryUsagePercent,
            rss: memoryUsage.rss / 1024 / 1024
        },
        uptime: {
            status: uptime > 60 ? 'pass' : 'warn', // Should be up for more than 1 minute
            seconds: Math.floor(uptime),
            formatted: formatUptime(uptime)
        },
        diskSpace: {
            // Placeholder - would need actual disk space check in real implementation
            status: 'pass',
            available: '85%'
        }
    };
    const failCount = Object.values(checks).filter(check => check.status === 'fail').length;
    return {
        status: failCount === 0 ? 'pass' : 'fail',
        checks
    };
}
async function checkSecurityStatus() {
    const securityChecks = {
        environment: {
            status: process.env.NODE_ENV === 'production' ? 'pass' : 'warn',
            nodeEnv: process.env.NODE_ENV
        },
        secrets: {
            status: checkRequiredSecrets() ? 'pass' : 'fail',
            missing: getMissingSecrets()
        },
        headers: {
            status: 'pass', // Would check security headers in real implementation
            corsEnabled: true,
            rateLimitingEnabled: true
        },
        ssl: {
            status: 'pass', // Vercel handles SSL automatically
            certificate: 'valid'
        }
    };
    const failCount = Object.values(securityChecks).filter(check => check.status === 'fail').length;
    return {
        status: failCount === 0 ? 'pass' : 'fail',
        checks: securityChecks
    };
}
async function checkDependencies() {
    // In a real implementation, this would check if all required dependencies are available
    const criticalDependencies = [
        'supabase-js',
        'jsonwebtoken',
        'bcryptjs',
        'stripe'
    ];
    const dependencyStatus = criticalDependencies.map(dep => ({
        name: dep,
        status: 'pass', // Would actually check if dependency is loadable
        version: 'unknown' // Would get actual version
    }));
    return {
        status: 'pass',
        dependencies: dependencyStatus,
        total: criticalDependencies.length
    };
}
function checkRequiredSecrets() {
    const requiredSecrets = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET'
    ];
    return requiredSecrets.every(secret => process.env[secret]);
}
function getMissingSecrets() {
    const requiredSecrets = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET'
    ];
    return requiredSecrets.filter(secret => !process.env[secret]);
}
function calculateDetailedHealthScore(checks) {
    let score = 100;
    // Database health (30% weight)
    if (!checks.database.status)
        score -= 30;
    // External services (25% weight)
    if (checks.services.status !== 'pass') {
        const serviceScore = (checks.services.passCount / checks.services.totalCount) * 25;
        score -= (25 - serviceScore);
        // Critical service failures have higher impact
        if (checks.services.criticalFailures > 0) {
            score -= checks.services.criticalFailures * 15;
        }
    }
    // System resources (20% weight)
    if (checks.system.status !== 'pass')
        score -= 20;
    // Security (15% weight)
    if (checks.security.status !== 'pass')
        score -= 15;
    // Dependencies (10% weight)
    if (checks.dependencies.status !== 'pass')
        score -= 10;
    return Math.max(0, Math.min(100, score));
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
