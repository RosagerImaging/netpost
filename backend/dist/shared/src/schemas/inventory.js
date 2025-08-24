"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossListingRequestSchema = exports.UpdateInventoryItemSchema = exports.CreateInventoryItemSchema = exports.MarketplaceListingSchema = exports.InventoryItemSchema = exports.DimensionsSchema = void 0;
const zod_1 = require("zod");
const inventory_1 = require("../types/inventory");
exports.DimensionsSchema = zod_1.z.object({
    length: zod_1.z.number().positive(),
    width: zod_1.z.number().positive(),
    height: zod_1.z.number().positive()
});
exports.InventoryItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1),
    images: zod_1.z.array(zod_1.z.string().url()).min(1).max(24),
    sku: zod_1.z.string().min(1),
    barcode: zod_1.z.string().optional(),
    costBasis: zod_1.z.number().nonnegative(),
    retailPrice: zod_1.z.number().positive(),
    quantityTotal: zod_1.z.number().int().nonnegative(),
    quantityAvailable: zod_1.z.number().int().nonnegative(),
    category: zod_1.z.string().min(1),
    brand: zod_1.z.string().optional(),
    condition: zod_1.z.nativeEnum(inventory_1.ItemCondition),
    size: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    material: zod_1.z.string().optional(),
    weight: zod_1.z.number().positive().optional(),
    dimensions: exports.DimensionsSchema.optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    listingGroupId: zod_1.z.string().uuid().optional(),
    marketplaceListings: zod_1.z.array(zod_1.z.lazy(() => exports.MarketplaceListingSchema))
});
exports.MarketplaceListingSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    inventoryItemId: zod_1.z.string().uuid(),
    platform: zod_1.z.nativeEnum(inventory_1.Platform),
    platformListingId: zod_1.z.string(),
    platformEditUrl: zod_1.z.string().url(),
    platformViewUrl: zod_1.z.string().url(),
    status: zod_1.z.nativeEnum(inventory_1.ListingStatus),
    quantity: zod_1.z.number().int().nonnegative(),
    price: zod_1.z.number().positive(),
    listingDate: zod_1.z.date(),
    lastUpdated: zod_1.z.date(),
    performanceMetrics: zod_1.z.record(zod_1.z.any()).optional()
});
exports.CreateInventoryItemSchema = exports.InventoryItemSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    marketplaceListings: true
});
exports.UpdateInventoryItemSchema = exports.CreateInventoryItemSchema.partial();
exports.CrossListingRequestSchema = zod_1.z.object({
    sourcePlatform: zod_1.z.nativeEnum(inventory_1.Platform),
    targetPlatforms: zod_1.z.array(zod_1.z.nativeEnum(inventory_1.Platform)).min(1),
    inventoryItems: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    optimizeSEO: zod_1.z.boolean().default(true),
    generateDescriptions: zod_1.z.boolean().default(false)
});
