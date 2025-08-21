import { VercelResponse } from '@vercel/node';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function handleError(error: unknown, res: VercelResponse) {
  console.error('API Error:', error);

  if (error instanceof Error) {
    const apiError = error as ApiError;
    const statusCode = apiError.statusCode || 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        message: apiError.message,
        code: apiError.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack })
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }
    });
  }
}

export function createApiError(message: string, statusCode: number = 400, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}