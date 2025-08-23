// User types
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

export enum SubscriptionTier {
  TRIAL = 'trial',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete'
}

// Inventory types
export interface InventoryItem {
  id: string;
  userId: string;
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
}

export enum ItemCondition {
  NEW = 'new',
  USED_LIKE_NEW = 'used_like_new',
  USED_GOOD = 'used_good',
  USED_FAIR = 'used_fair',
  USED_POOR = 'used_poor',
  FOR_PARTS = 'for_parts'
}

export enum Platform {
  EBAY = 'ebay',
  AMAZON = 'amazon',
  MERCARI = 'mercari',
  POSHMARK = 'poshmark',
  FACEBOOK_MARKETPLACE = 'facebook_marketplace',
  DEPOP = 'depop',
  VINTED = 'vinted',
  ETSY = 'etsy'
}

// Cross-listing types
export interface CrossListingRequest {
  id: string;
  userId: string;
  sourcePlatform: Platform;
  targetPlatforms: Platform[];
  inventoryItems: string[];
  status: CrossListingStatus;
  optimizeSEO: boolean;
  generateDescriptions: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  results?: CrossListingResult[];
}

export interface CrossListingResult {
  id: string;
  requestId: string;
  inventoryItemId: string;
  platform: Platform;
  status: 'pending' | 'success' | 'failed';
  listingId?: string;
  listingUrl?: string;
  error?: string;
  createdAt: Date;
}

export enum CrossListingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Analytics types
export interface Analytics {
  overview: AnalyticsOverview;
  salesData: SalesData[];
  platformData: PlatformAnalytics[];
  categoryData: CategoryAnalytics[];
}

export interface AnalyticsOverview {
  totalRevenue: number;
  totalItems: number;
  activeListings: number;
  crossListings: number;
  revenueChange: string;
  itemsChange: string;
  listingsChange: string;
  crossListingsChange: string;
}

export interface SalesData {
  date: string;
  revenue: number;
  sales: number;
  crossListings: number;
}

export interface PlatformAnalytics {
  platform: Platform;
  revenue: number;
  sales: number;
  listings: number;
  conversionRate: number;
}

export interface CategoryAnalytics {
  category: string;
  revenue: number;
  sales: number;
  listings: number;
  avgPrice: number;
}

// Dashboard-specific types
export interface DashboardStats {
  totalItems: number
  activeListings: number
  monthlyRevenue: number
  crossListings: number
  revenueChange: string
  listingsChange: string
  crossListingsChange: string
  itemsChange: string
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface FilterOptions {
  search?: string
  category?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface PaginatedApiResponse<T> extends ApiResponse {
  data: {
    items: T[]
    pagination: PaginationData
  }
}

// Form types
export interface InventoryItemFormData {
  title: string
  description: string
  images: string[]
  sku: string
  barcode?: string
  costBasis: number
  retailPrice: number
  quantityTotal: number
  quantityAvailable: number
  category: string
  brand?: string
  condition: string
  size?: string
  color?: string
  material?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

// Component props types
export interface TableColumn<T = any> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}