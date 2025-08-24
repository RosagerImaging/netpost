export declare const PLATFORM_LIMITS: {
    ebay: {
        maxImages: number;
        maxTitleLength: number;
        maxDescriptionLength: number;
        maxVideoSize: number;
        supportedImageFormats: string[];
        supportedVideoFormats: string[];
    };
    mercari: {
        maxImages: number;
        maxTitleLength: number;
        maxDescriptionLength: number;
        supportedImageFormats: string[];
        supportedVideoFormats: never[];
    };
    poshmark: {
        maxImages: number;
        maxTitleLength: number;
        maxDescriptionLength: number;
        supportedImageFormats: string[];
        supportedVideoFormats: never[];
    };
    facebook_marketplace: {
        maxImages: number;
        maxTitleLength: number;
        maxDescriptionLength: number;
        supportedImageFormats: string[];
        supportedVideoFormats: string[];
    };
    depop: {
        maxImages: number;
        maxTitleLength: number;
        maxDescriptionLength: number;
        supportedImageFormats: string[];
        supportedVideoFormats: never[];
    };
    etsy: {
        maxImages: number;
        maxTitleLength: number;
        maxDescriptionLength: number;
        maxVideoSize: number;
        supportedImageFormats: string[];
        supportedVideoFormats: string[];
    };
};
export declare const SUBSCRIPTION_LIMITS: {
    trial: {
        maxListings: number;
        maxCrossListings: number;
        aiDescriptionsPerMonth: number;
        seoAnalysesPerMonth: number;
    };
    starter: {
        maxListings: number;
        maxCrossListings: number;
        aiDescriptionsPerMonth: number;
        seoAnalysesPerMonth: number;
    };
    professional: {
        maxListings: number;
        maxCrossListings: number;
        aiDescriptionsPerMonth: number;
        seoAnalysesPerMonth: number;
    };
    enterprise: {
        maxListings: number;
        maxCrossListings: number;
        aiDescriptionsPerMonth: number;
        seoAnalysesPerMonth: number;
    };
};
export declare const PLATFORM_FEES: {
    ebay: {
        listingFee: number;
        finalValueFeePercentage: number;
        paymentProcessingFee: number;
        internationalFee: number;
    };
    mercari: {
        listingFee: number;
        finalValueFeePercentage: number;
        paymentProcessingFee: number;
        processingFee: number;
    };
    poshmark: {
        listingFee: number;
        finalValueFeePercentage: number;
        paymentProcessingFee: number;
        under15Fee: number;
    };
    facebook_marketplace: {
        listingFee: number;
        finalValueFeePercentage: number;
        paymentProcessingFee: number;
        processingFee: number;
    };
    depop: {
        listingFee: number;
        finalValueFeePercentage: number;
        paymentProcessingFee: number;
        processingFee: number;
    };
    etsy: {
        listingFee: number;
        finalValueFeePercentage: number;
        paymentProcessingFee: number;
        processingFee: number;
    };
};
export declare const SEO_KEYWORDS: {
    fashion: string[];
    electronics: string[];
    collectibles: string[];
    home: string[];
    beauty: string[];
};
export declare const AUTOMATION_DELAYS: {
    delisting: number;
    crossListing: number;
    seoAnalysis: number;
    priceUpdate: number;
};
