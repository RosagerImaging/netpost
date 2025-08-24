"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.handleError = handleError;
exports.createApiError = createApiError;
function handleError(error, res) {
    console.error('API Error:', error);
    if (error instanceof Error) {
        const apiError = error;
        const statusCode = apiError.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: {
                message: apiError.message,
                code: apiError.code || 'INTERNAL_ERROR',
                ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack })
            }
        });
    }
    else {
        res.status(500).json({
            success: false,
            error: {
                message: 'An unexpected error occurred',
                code: 'INTERNAL_ERROR'
            }
        });
    }
}
function createApiError(message, statusCode = 400, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
class ValidationError extends Error {
    constructor() {
        super(...arguments);
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
    }
}
exports.ValidationError = ValidationError;
