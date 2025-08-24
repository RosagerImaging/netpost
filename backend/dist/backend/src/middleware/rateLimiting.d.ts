import { VercelRequest, VercelResponse } from '@vercel/node';
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: VercelRequest) => string;
    skipSuccessfulRequests?: boolean;
    message?: string;
}
export declare function createRateLimiter(options: RateLimitOptions): (req: VercelRequest, res: VercelResponse) => boolean;
export declare const authRateLimit: (req: VercelRequest, res: VercelResponse) => boolean;
export declare const apiRateLimit: (req: VercelRequest, res: VercelResponse) => boolean;
export declare const strictRateLimit: (req: VercelRequest, res: VercelResponse) => boolean;
