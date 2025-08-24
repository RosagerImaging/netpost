import { VercelRequest } from '@vercel/node';
export interface AuthUser {
    id: string;
    email: string;
    subscriptionTier: string;
    subscriptionStatus: string;
}
export declare function authenticateUser(req: VercelRequest): Promise<AuthUser | null>;
export declare function requireAuth(req: VercelRequest): Promise<AuthUser>;
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare function generateTokenPair(userId: string): TokenPair;
export declare function generateJWT(userId: string): string;
export declare function verifyRefreshToken(refreshToken: string): Promise<{
    userId: string;
} | null>;
