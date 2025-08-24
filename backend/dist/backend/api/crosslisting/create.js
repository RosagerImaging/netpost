"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, rateLimiting_1.strictRateLimit)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        const { sourcePlatform, targetPlatforms, inventoryItems, optimizeSEO = true, generateDescriptions = false } = req.body;
        // Validation
        if (!sourcePlatform || !targetPlatforms || !inventoryItems) {
            throw new errorHandler_1.ValidationError('Source platform, target platforms, and inventory items are required');
        }
        if (!Array.isArray(targetPlatforms) || targetPlatforms.length === 0) {
            throw new errorHandler_1.ValidationError('At least one target platform is required');
        }
        if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
            throw new errorHandler_1.ValidationError('At least one inventory item is required');
        }
        // Validate platforms
        const validPlatforms = ['ebay', 'mercari', 'poshmark', 'facebook_marketplace', 'depop', 'etsy'];
        if (!validPlatforms.includes(sourcePlatform)) {
            throw new errorHandler_1.ValidationError('Invalid source platform');
        }
        for (const platform of targetPlatforms) {
            if (!validPlatforms.includes(platform)) {
                throw new errorHandler_1.ValidationError(`Invalid target platform: ${platform}`);
            }
        }
        // Verify user has credentials for target platforms
        const { data: userCredentials, error: credError } = await database_1.supabaseAdmin
            .from('platform_credentials')
            .select('platform, is_active')
            .eq('user_id', user.id)
            .in('platform', targetPlatforms)
            .eq('is_active', true);
        if (credError) {
            throw new Error('Failed to verify platform credentials');
        }
        const availablePlatforms = userCredentials?.map(c => c.platform) || [];
        const missingCredentials = targetPlatforms.filter(p => !availablePlatforms.includes(p));
        if (missingCredentials.length > 0) {
            throw new errorHandler_1.ValidationError(`Missing credentials for platforms: ${missingCredentials.join(', ')}`);
        }
        // Check subscription limits
        const { data: userSubscription } = await database_1.supabaseAdmin
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', user.id)
            .single();
        if (!userSubscription || (userSubscription.subscription_status !== 'active' && userSubscription.subscription_status !== 'trialing')) {
            throw new errorHandler_1.ValidationError('Active subscription required for cross-listing');
        }
        // Check subscription limits
        const crossListingLimits = {
            trial: 5,
            starter: 25,
            professional: 100,
            enterprise: 1000
        };
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const { count: monthlyRequests } = await database_1.supabaseAdmin
            .from('crosslisting_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', currentMonth.toISOString());
        const limit = crossListingLimits[userSubscription.subscription_tier];
        if ((monthlyRequests || 0) >= limit) {
            throw new errorHandler_1.ValidationError(`Monthly cross-listing limit reached (${limit}). Upgrade your subscription for more.`);
        }
        // Verify inventory items belong to user
        const { data: userItems, error: itemsError } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('id, title, status')
            .eq('user_id', user.id)
            .in('id', inventoryItems);
        if (itemsError || !userItems || userItems.length !== inventoryItems.length) {
            throw new errorHandler_1.ValidationError('Some inventory items not found or not accessible');
        }
        // Check if items are in a valid state for cross-listing
        const invalidItems = userItems.filter(item => !['active', 'draft'].includes(item.status));
        if (invalidItems.length > 0) {
            throw new errorHandler_1.ValidationError(`Cannot cross-list items with status: ${invalidItems.map(i => i.status).join(', ')}`);
        }
        // Create cross-listing request
        const { data: crossListingRequest, error: createError } = await database_1.supabaseAdmin
            .from('crosslisting_requests')
            .insert({
            user_id: user.id,
            source_platform: sourcePlatform,
            target_platforms: targetPlatforms,
            inventory_items: inventoryItems,
            status: 'pending',
            optimize_seo: optimizeSEO,
            generate_descriptions: generateDescriptions,
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (createError || !crossListingRequest) {
            console.error('Cross-listing creation error:', createError);
            throw new Error('Failed to create cross-listing request');
        }
        // Process cross-listing request immediately (in production, this would be queued)
        try {
            await processCrossListingRequest(crossListingRequest.id);
        }
        catch (processError) {
            console.error('Cross-listing processing error:', processError);
            // Update request status to failed
            await database_1.supabaseAdmin
                .from('crosslisting_requests')
                .update({
                status: 'failed',
                error_message: 'Failed to process cross-listing request',
                completed_at: new Date().toISOString()
            })
                .eq('id', crossListingRequest.id);
        }
        res.status(201).json({
            success: true,
            data: {
                requestId: crossListingRequest.id,
                status: 'pending',
                estimatedCompletionTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes estimate
                message: 'Cross-listing request created successfully'
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
// Mock cross-listing processing function
async function processCrossListingRequest(requestId) {
    // Update status to in_progress
    await database_1.supabaseAdmin
        .from('crosslisting_requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId);
    // Get request details
    const { data: request, error } = await database_1.supabaseAdmin
        .from('crosslisting_requests')
        .select(`
      *,
      inventory_items:inventory_items!inventory_items_user_id_fkey(*)
    `)
        .eq('id', requestId)
        .single();
    if (error || !request) {
        throw new Error('Cross-listing request not found');
    }
    const results = [];
    // Simulate processing each item to each target platform
    for (const itemId of request.inventory_items) {
        // Get item details
        const { data: item } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('*')
            .eq('id', itemId)
            .single();
        if (!item)
            continue;
        for (const platform of request.target_platforms) {
            try {
                // Simulate cross-listing to platform
                await simulatePlatformListing(item, platform, request.optimize_seo);
                // Create marketplace listing record
                const { data: marketplaceListing, error: listingError } = await database_1.supabaseAdmin
                    .from('marketplace_listings')
                    .insert({
                    inventory_item_id: item.id,
                    platform: platform,
                    platform_listing_id: `mock_${platform}_${Date.now()}`,
                    platform_edit_url: `https://${platform}.com/edit/mock_listing`,
                    platform_view_url: `https://${platform}.com/view/mock_listing`,
                    status: 'active',
                    quantity: Math.min(item.quantity_available, 1),
                    price: calculatePlatformPrice(item.retail_price, platform),
                    listing_date: new Date().toISOString()
                })
                    .select()
                    .single();
                if (!listingError) {
                    results.push({
                        itemId: item.id,
                        platform: platform,
                        status: 'success',
                        listingId: marketplaceListing.id,
                        platformListingId: marketplaceListing.platform_listing_id,
                        viewUrl: marketplaceListing.platform_view_url
                    });
                }
                else {
                    results.push({
                        itemId: item.id,
                        platform: platform,
                        status: 'failed',
                        error: listingError.message
                    });
                }
            }
            catch (error) {
                results.push({
                    itemId: item.id,
                    platform: platform,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }
    // Update request with results
    await database_1.supabaseAdmin
        .from('crosslisting_requests')
        .update({
        status: 'completed',
        results: results,
        completed_at: new Date().toISOString()
    })
        .eq('id', requestId);
    return results;
}
// Mock platform listing simulation
async function simulatePlatformListing(item, platform, optimizeSEO) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    // Simulate some failures
    if (Math.random() < 0.1) {
        throw new Error(`Platform ${platform} API error`);
    }
    return {
        success: true,
        listingId: `mock_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        optimizedTitle: optimizeSEO ? optimizeTitle(item.title, platform) : item.title,
        optimizedDescription: optimizeSEO ? optimizeDescription(item.description, platform) : item.description
    };
}
// Mock SEO optimization functions
function optimizeTitle(title, platform) {
    const platformKeywords = {
        ebay: ['Fast Shipping', 'Authentic', 'Brand New'],
        mercari: ['Great Deal', 'Like New', 'Fast Ship'],
        poshmark: ['Trendy', 'Designer', 'Boutique Style'],
        facebook_marketplace: ['Local Pickup', 'Great Condition', 'Must See'],
        depop: ['Vintage', 'Y2K', 'Aesthetic'],
        etsy: ['Handmade', 'Unique', 'Custom']
    };
    const keywords = platformKeywords[platform] || [];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    return `${title} - ${randomKeyword}`;
}
function optimizeDescription(description, platform) {
    const platformTags = {
        ebay: '#FastShipping #BuyItNow #TopRated',
        mercari: '#GreatDeal #AuthenticOnly #FastShip',
        poshmark: '#PoshmarkFinds #Trendy #BoutiqueStyle',
        facebook_marketplace: '#LocalPickup #GreatCondition #MustSee',
        depop: '#Vintage #Y2K #Aesthetic #DepopFinds',
        etsy: '#Handmade #Unique #CustomMade #Artisan'
    };
    const tags = platformTags[platform] || '';
    return `${description}\n\n${tags}`;
}
function calculatePlatformPrice(basePrice, platform) {
    // Adjust price based on platform fees
    const platformMultipliers = {
        ebay: 1.15, // Account for eBay fees
        mercari: 1.12, // Account for Mercari fees
        poshmark: 1.25, // Account for Poshmark fees
        facebook_marketplace: 1.0, // No fees for local
        depop: 1.12, // Account for Depop fees
        etsy: 1.10 // Account for Etsy fees
    };
    const multiplier = platformMultipliers[platform] || 1.0;
    return Math.round(basePrice * multiplier * 100) / 100;
}
