"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTOMATION_DELAYS = exports.SEO_KEYWORDS = exports.PLATFORM_FEES = exports.SUBSCRIPTION_LIMITS = exports.PLATFORM_LIMITS = void 0;
const inventory_1 = require("../types/inventory");
exports.PLATFORM_LIMITS = {
    [inventory_1.Platform.EBAY]: {
        maxImages: 24,
        maxTitleLength: 80,
        maxDescriptionLength: 500000,
        maxVideoSize: 150 * 1024 * 1024, // 150MB
        supportedImageFormats: ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF'],
        supportedVideoFormats: ['MP4', 'MOV', 'AVI']
    },
    [inventory_1.Platform.MERCARI]: {
        maxImages: 20,
        maxTitleLength: 40,
        maxDescriptionLength: 1000,
        supportedImageFormats: ['JPEG', 'PNG'],
        supportedVideoFormats: []
    },
    [inventory_1.Platform.POSHMARK]: {
        maxImages: 16,
        maxTitleLength: 50,
        maxDescriptionLength: 500,
        supportedImageFormats: ['JPEG', 'PNG'],
        supportedVideoFormats: []
    },
    [inventory_1.Platform.FACEBOOK_MARKETPLACE]: {
        maxImages: 20,
        maxTitleLength: 100,
        maxDescriptionLength: 9999,
        supportedImageFormats: ['JPEG', 'PNG', 'GIF'],
        supportedVideoFormats: ['MP4', 'MOV']
    },
    [inventory_1.Platform.DEPOP]: {
        maxImages: 4,
        maxTitleLength: 65,
        maxDescriptionLength: 1000,
        supportedImageFormats: ['JPEG', 'PNG'],
        supportedVideoFormats: []
    },
    [inventory_1.Platform.ETSY]: {
        maxImages: 13,
        maxTitleLength: 140,
        maxDescriptionLength: 13000,
        maxVideoSize: 100 * 1024 * 1024, // 100MB
        supportedImageFormats: ['JPEG', 'PNG', 'GIF'],
        supportedVideoFormats: ['MP4', 'MOV', 'AVI', 'WMV']
    }
};
exports.SUBSCRIPTION_LIMITS = {
    trial: {
        maxListings: 25,
        maxCrossListings: 25,
        aiDescriptionsPerMonth: 10,
        seoAnalysesPerMonth: 5
    },
    starter: {
        maxListings: 200,
        maxCrossListings: 50,
        aiDescriptionsPerMonth: 100,
        seoAnalysesPerMonth: 50
    },
    professional: {
        maxListings: -1, // unlimited
        maxCrossListings: -1, // unlimited
        aiDescriptionsPerMonth: 500,
        seoAnalysesPerMonth: 200
    },
    enterprise: {
        maxListings: -1, // unlimited
        maxCrossListings: -1, // unlimited
        aiDescriptionsPerMonth: -1, // unlimited
        seoAnalysesPerMonth: -1 // unlimited
    }
};
exports.PLATFORM_FEES = {
    [inventory_1.Platform.EBAY]: {
        listingFee: 0,
        finalValueFeePercentage: 13.25,
        paymentProcessingFee: 2.9,
        internationalFee: 1.65
    },
    [inventory_1.Platform.MERCARI]: {
        listingFee: 0,
        finalValueFeePercentage: 10,
        paymentProcessingFee: 2.9,
        processingFee: 0.30
    },
    [inventory_1.Platform.POSHMARK]: {
        listingFee: 0,
        finalValueFeePercentage: 20,
        paymentProcessingFee: 0, // included in final value fee
        under15Fee: 2.95 // flat fee for sales under $15
    },
    [inventory_1.Platform.FACEBOOK_MARKETPLACE]: {
        listingFee: 0,
        finalValueFeePercentage: 5,
        paymentProcessingFee: 2.9,
        processingFee: 0.30
    },
    [inventory_1.Platform.DEPOP]: {
        listingFee: 0,
        finalValueFeePercentage: 10,
        paymentProcessingFee: 3.3,
        processingFee: 0.45
    },
    [inventory_1.Platform.ETSY]: {
        listingFee: 0.20,
        finalValueFeePercentage: 6.5,
        paymentProcessingFee: 3.0,
        processingFee: 0.25
    }
};
exports.SEO_KEYWORDS = {
    fashion: ['vintage', 'designer', 'authentic', 'rare', 'limited', 'trendy', 'style', 'outfit'],
    electronics: ['new', 'sealed', 'warranty', 'genuine', 'original', 'fast shipping', 'tested'],
    collectibles: ['rare', 'vintage', 'authentic', 'mint', 'limited edition', 'collector', 'investment'],
    home: ['home decor', 'interior design', 'functional', 'stylish', 'modern', 'classic'],
    beauty: ['new', 'full size', 'authentic', 'sealed', 'fresh', 'professional', 'salon quality']
};
exports.AUTOMATION_DELAYS = {
    delisting: 5 * 60 * 1000, // 5 minutes
    crossListing: 2 * 1000, // 2 seconds between listings
    seoAnalysis: 1 * 1000, // 1 second between analyses
    priceUpdate: 10 * 1000 // 10 seconds between price updates
};
