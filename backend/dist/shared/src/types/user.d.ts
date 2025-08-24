export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
    trialEndDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    platformCredentials: PlatformCredential[];
    preferences: UserPreferences;
}
export interface PlatformCredential {
    id: string;
    userId: string;
    platform: Platform;
    encryptedCredentials: string;
    isActive: boolean;
    lastVerified?: Date;
    createdAt: Date;
}
export interface UserPreferences {
    id: string;
    userId: string;
    darkMode: boolean;
    autoOptimizeSEO: boolean;
    enableAutoDelisting: boolean;
    defaultListingDuration: number;
    emailNotifications: boolean;
    priceOptimizationEnabled: boolean;
    aiDescriptionEnabled: boolean;
    updatedAt: Date;
}
export declare enum SubscriptionTier {
    TRIAL = "trial",
    STARTER = "starter",
    PROFESSIONAL = "professional",
    ENTERPRISE = "enterprise"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    PAST_DUE = "past_due",
    CANCELED = "canceled",
    TRIALING = "trialing",
    INCOMPLETE = "incomplete"
}
import { Platform } from './inventory';
