import { VercelResponse } from '@vercel/node';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function handleError(error: unknown, res: VercelResponse): void;
export declare function createApiError(message: string, statusCode?: number, code?: string): ApiError;
export declare class ValidationError extends Error {
    statusCode: number;
    code: string;
}
