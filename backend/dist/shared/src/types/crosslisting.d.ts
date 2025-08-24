import { Platform } from './inventory';
export interface CrossListingRequest {
    id: string;
    userId: string;
    sourcePlatform: Platform;
    targetPlatforms: Platform[];
    inventoryItems: string[];
    status: CrossListingStatus;
    createdAt: Date;
    completedAt?: Date;
    results: CrossListingResult[];
}
export interface CrossListingResult {
    inventoryItemId: string;
    platform: Platform;
    status: 'success' | 'failed' | 'pending';
    platformListingId?: string;
    error?: string;
    listingUrl?: string;
}
export declare enum CrossListingStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface PlatformMapping {
    platform: Platform;
    fieldMappings: FieldMapping[];
    categoryMappings: CategoryMapping[];
    requirements: PlatformRequirements;
}
export interface FieldMapping {
    sourceField: string;
    targetField: string;
    transformation?: string;
    required: boolean;
}
export interface CategoryMapping {
    sourceCategory: string;
    targetCategory: string;
    platform: Platform;
}
export interface PlatformRequirements {
    platform: Platform;
    maxImages: number;
    maxVideoSize?: number;
    requiredFields: string[];
    maxTitleLength: number;
    maxDescriptionLength: number;
    supportedConditions: string[];
    feesStructure: FeeStructure;
}
export interface FeeStructure {
    listingFee: number;
    finalValueFeePercentage: number;
    paymentProcessingFee: number;
    promoteFeesAvailable: boolean;
}
export interface SEOAnalysis {
    id: string;
    inventoryItemId: string;
    platform: Platform;
    score: number;
    recommendations: SEORecommendation[];
    keywordSuggestions: string[];
    competitorAnalysis?: CompetitorAnalysis;
    createdAt: Date;
}
export interface SEORecommendation {
    type: 'title' | 'description' | 'images' | 'pricing' | 'category';
    priority: 'high' | 'medium' | 'low';
    description: string;
    suggestedChange?: string;
    estimatedImpact: number;
}
export interface CompetitorAnalysis {
    similarItems: CompetitorItem[];
    averagePrice: number;
    priceRange: {
        min: number;
        max: number;
    };
    topKeywords: string[];
    marketPositioning: 'below' | 'at' | 'above';
}
export interface CompetitorItem {
    title: string;
    price: number;
    platform: Platform;
    url: string;
    condition: string;
    daysListed: number;
}
