"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../../src/middleware/cors");
// Liveness probe for Kubernetes-style health checks
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const startTime = performance.now();
        // Basic liveness checks - just verify the process is running and responsive
        const livenessChecks = {
            process: checkProcessHealth(),
            memory: checkMemoryHealth(),
            responsiveness: true // If we got here, we're responsive
        };
        const isAlive = Object.values(livenessChecks).every(check => check === true);
        const responseTime = performance.now() - startTime;
        const livenessData = {
            alive: isAlive,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime.toFixed(2)}ms`,
            checks: {
                process: {
                    alive: livenessChecks.process,
                    uptime: `${Math.floor(process.uptime())}s`,
                    pid: process.pid
                },
                memory: {
                    healthy: livenessChecks.memory,
                    heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
                },
                responsiveness: {
                    responsive: livenessChecks.responsiveness,
                    responseTime: `${responseTime.toFixed(2)}ms`
                }
            },
            metadata: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        if (isAlive) {
            res.status(200).json({
                success: true,
                data: livenessData
            });
        }
        else {
            res.status(503).json({
                success: false,
                data: livenessData
            });
        }
    }
    catch (error) {
        console.error('Liveness check error:', error);
        res.status(503).json({
            success: false,
            alive: false,
            error: {
                message: 'Liveness check failed',
                code: 'LIVENESS_ERROR'
            }
        });
    }
}
function checkProcessHealth() {
    try {
        // Check if process is running normally
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        // Basic sanity checks
        return uptime > 0 && memoryUsage.heapUsed > 0;
    }
    catch (error) {
        return false;
    }
}
function checkMemoryHealth() {
    try {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        // Consider memory unhealthy if using more than 800MB (adjust as needed)
        // This is a conservative threshold for serverless functions
        return heapUsedMB < 800;
    }
    catch (error) {
        return false;
    }
}
