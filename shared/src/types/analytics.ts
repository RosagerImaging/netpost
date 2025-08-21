export interface SalesAnalytics {
  id: string;
  userId: string;
  period: AnalyticsPeriod;
  totalRevenue: number;
  totalProfit: number;
  totalCosts: number;
  itemsSold: number;
  averageSellingPrice: number;
  averageDaysToSell: number;
  platformBreakdown: PlatformSalesData[];
  categoryBreakdown: CategorySalesData[];
  createdAt: Date;
}

export interface PlatformSalesData {
  platform: Platform;
  revenue: number;
  profit: number;
  itemsSold: number;
  averagePrice: number;
  fees: number;
}

export interface CategorySalesData {
  category: string;
  revenue: number;
  profit: number;
  itemsSold: number;
  averagePrice: number;
  turnRate: number;
}

export interface InventoryMetrics {
  id: string;
  userId: string;
  totalItems: number;
  activeListings: number;
  soldItems: number;
  draftItems: number;
  totalValue: number;
  averageCostBasis: number;
  turnoverRate: number;
  deadStock: DeadStockItem[];
  topPerformingCategories: string[];
  understockAlerts: UnderstockAlert[];
  createdAt: Date;
}

export interface DeadStockItem {
  inventoryItemId: string;
  title: string;
  daysListed: number;
  currentPrice: number;
  suggestedActions: string[];
}

export interface UnderstockAlert {
  category: string;
  currentStock: number;
  recommendedStock: number;
  reason: string;
}

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface TaxDocument {
  id: string;
  userId: string;
  year: number;
  documentType: TaxDocumentType;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  platformBreakdown: TaxPlatformData[];
  expenseCategories: ExpenseCategory[];
  generatedAt: Date;
  downloadUrl: string;
}

export enum TaxDocumentType {
  ANNUAL_SUMMARY = 'annual_summary',
  QUARTERLY_REPORT = 'quarterly_report',
  FORM_1099 = 'form_1099',
  EXPENSE_REPORT = 'expense_report'
}

export interface TaxPlatformData {
  platform: Platform;
  revenue: number;
  fees: number;
  netRevenue: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  deductible: boolean;
  receipts: Receipt[];
}

export interface Receipt {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  imageUrl?: string;
  vendor: string;
}

import { Platform } from './inventory';