import { VercelRequest, VercelResponse } from '@vercel/node';
export declare function getBruteForceKey(req: VercelRequest, email?: string): string;
export declare function checkBruteForce(key: string): {
    blocked: boolean;
    retryAfter?: number;
};
export declare function recordFailedAttempt(key: string): void;
export declare function recordSuccessfulAttempt(key: string): void;
export declare function enhancedAuthProtection(req: VercelRequest, res: VercelResponse): boolean;
export declare function validateInput(req: VercelRequest, res: VercelResponse): boolean;
export declare const sensitiveOperationRateLimit: (req: VercelRequest, res: VercelResponse) => boolean;
export declare const passwordResetRateLimit: (req: VercelRequest, res: VercelResponse) => boolean;
export declare const registrationRateLimit: (req: VercelRequest, res: VercelResponse) => boolean;
