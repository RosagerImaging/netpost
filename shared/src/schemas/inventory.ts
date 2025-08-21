import { z } from 'zod';
import { ItemCondition, Platform, ListingStatus, InventoryStatus } from '../types/inventory';

export const DimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive()
});

export const InventoryItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  images: z.array(z.string().url()).min(1).max(24),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  costBasis: z.number().nonnegative(),
  retailPrice: z.number().positive(),
  quantityTotal: z.number().int().nonnegative(),
  quantityAvailable: z.number().int().nonnegative(),
  category: z.string().min(1),
  brand: z.string().optional(),
  condition: z.nativeEnum(ItemCondition),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: DimensionsSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  listingGroupId: z.string().uuid().optional(),
  marketplaceListings: z.array(z.lazy(() => MarketplaceListingSchema))
});

export const MarketplaceListingSchema = z.object({
  id: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  platform: z.nativeEnum(Platform),
  platformListingId: z.string(),
  platformEditUrl: z.string().url(),
  platformViewUrl: z.string().url(),
  status: z.nativeEnum(ListingStatus),
  quantity: z.number().int().nonnegative(),
  price: z.number().positive(),
  listingDate: z.date(),
  lastUpdated: z.date(),
  performanceMetrics: z.record(z.any()).optional()
});

export const CreateInventoryItemSchema = InventoryItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  marketplaceListings: true
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();

export const CrossListingRequestSchema = z.object({
  sourcePlatform: z.nativeEnum(Platform),
  targetPlatforms: z.array(z.nativeEnum(Platform)).min(1),
  inventoryItems: z.array(z.string().uuid()).min(1),
  optimizeSEO: z.boolean().default(true),
  generateDescriptions: z.boolean().default(false)
});