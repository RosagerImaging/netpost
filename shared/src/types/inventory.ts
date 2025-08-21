export interface InventoryItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  sku: string;
  barcode?: string;
  costBasis: number;
  retailPrice: number;
  quantityTotal: number;
  quantityAvailable: number;
  category: string;
  brand?: string;
  condition: ItemCondition;
  size?: string;
  color?: string;
  material?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
  listingGroupId?: string;
  marketplaceListings: MarketplaceListing[];
}

export interface MarketplaceListing {
  id: string;
  inventoryItemId: string;
  platform: Platform;
  platformListingId: string;
  platformEditUrl: string;
  platformViewUrl: string;
  status: ListingStatus;
  quantity: number;
  price: number;
  listingDate: Date;
  lastUpdated: Date;
  performanceMetrics?: Record<string, any>;
}

export enum ItemCondition {
  NEW = 'new',
  NEW_WITH_TAGS = 'new_with_tags',
  NEW_WITHOUT_TAGS = 'new_without_tags',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum Platform {
  EBAY = 'ebay',
  MERCARI = 'mercari',
  POSHMARK = 'poshmark',
  FACEBOOK_MARKETPLACE = 'facebook_marketplace',
  DEPOP = 'depop',
  ETSY = 'etsy'
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  ENDED = 'ended',
  DRAFT = 'draft',
  SUSPENDED = 'suspended',
  OUT_OF_STOCK = 'out_of_stock'
}

export enum InventoryStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  GRAYED_OUT = 'grayed_out',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}