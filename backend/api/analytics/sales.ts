import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError } from '../../src/middleware/errorHandler';
import { apiRateLimit } from '../../src/middleware/rateLimiting';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;
  if (!apiRateLimit(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);
    
    // Parse query parameters
    const {
      startDate,
      endDate,
      granularity = 'day', // day, week, month
      platform,
      category
    } = req.query;

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build query
    let query = supabaseAdmin
      .from('marketplace_listings')
      .select(`
        *,
        inventory_items!inner(
          user_id,
          title,
          category,
          cost_basis,
          brand
        )
      `)
      .eq('inventory_items.user_id', user.id)
      .eq('status', 'sold')
      .gte('last_updated', start.toISOString())
      .lte('last_updated', end.toISOString())
      .order('last_updated', { ascending: true });

    // Apply filters
    if (platform) {
      query = query.eq('platform', platform);
    }

    if (category) {
      query = query.eq('inventory_items.category', category);
    }

    const { data: sales, error } = await query;

    if (error) {
      console.error('Failed to get sales data:', error);
      throw new Error('Failed to fetch sales data');
    }

    // Process sales data based on granularity
    const processedData = processSalesData(sales || [], granularity as string);

    // Calculate trends and metrics
    const metrics = calculateSalesMetrics(sales || []);

    // Get comparison period data
    const comparisonStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    const comparisonEnd = start;

    let comparisonQuery = supabaseAdmin
      .from('marketplace_listings')
      .select(`
        price,
        quantity,
        inventory_items!inner(
          user_id,
          cost_basis
        )
      `)
      .eq('inventory_items.user_id', user.id)
      .eq('status', 'sold')
      .gte('last_updated', comparisonStart.toISOString())
      .lte('last_updated', comparisonEnd.toISOString());

    if (platform) {
      comparisonQuery = comparisonQuery.eq('platform', platform);
    }

    if (category) {
      comparisonQuery = comparisonQuery.eq('inventory_items.category', category);
    }

    const { data: comparisonSales, error: comparisonError } = await comparisonQuery;

    if (comparisonError) {
      console.error('Failed to get comparison data:', comparisonError);
    }

    const comparisonMetrics = calculateSalesMetrics(comparisonSales || []);

    // Calculate percentage changes
    const changes = {
      revenue: calculatePercentageChange(metrics.totalRevenue, comparisonMetrics.totalRevenue),
      profit: calculatePercentageChange(metrics.totalProfit, comparisonMetrics.totalProfit),
      itemsSold: calculatePercentageChange(metrics.itemsSold, comparisonMetrics.itemsSold),
      avgOrderValue: calculatePercentageChange(metrics.avgOrderValue, comparisonMetrics.avgOrderValue)
    };

    res.status(200).json({
      success: true,
      data: {
        salesData: processedData,
        metrics: {
          ...metrics,
          changes
        },
        summary: {
          totalSales: sales?.length || 0,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString()
          },
          granularity,
          filters: {
            platform: platform || null,
            category: category || null
          }
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}

function processSalesData(sales: any[], granularity: string) {
  const groupedData: { [key: string]: any } = {};

  sales.forEach(sale => {
    const date = new Date(sale.last_updated);
    let key = '';

    switch (granularity) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        date: key,
        revenue: 0,
        profit: 0,
        itemsSold: 0,
        orders: 0,
        platforms: {},
        categories: {}
      };
    }

    const revenue = sale.price * sale.quantity;
    const profit = revenue - (sale.inventory_items.cost_basis * sale.quantity);

    groupedData[key].revenue += revenue;
    groupedData[key].profit += profit;
    groupedData[key].itemsSold += sale.quantity;
    groupedData[key].orders += 1;

    // Platform breakdown
    if (!groupedData[key].platforms[sale.platform]) {
      groupedData[key].platforms[sale.platform] = {
        revenue: 0,
        itemsSold: 0,
        orders: 0
      };
    }
    groupedData[key].platforms[sale.platform].revenue += revenue;
    groupedData[key].platforms[sale.platform].itemsSold += sale.quantity;
    groupedData[key].platforms[sale.platform].orders += 1;

    // Category breakdown
    const category = sale.inventory_items.category;
    if (!groupedData[key].categories[category]) {
      groupedData[key].categories[category] = {
        revenue: 0,
        itemsSold: 0,
        orders: 0
      };
    }
    groupedData[key].categories[category].revenue += revenue;
    groupedData[key].categories[category].itemsSold += sale.quantity;
    groupedData[key].categories[category].orders += 1;
  });

  return Object.values(groupedData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function calculateSalesMetrics(sales: any[]) {
  if (sales.length === 0) {
    return {
      totalRevenue: 0,
      totalProfit: 0,
      totalCosts: 0,
      itemsSold: 0,
      orders: sales.length,
      avgOrderValue: 0,
      avgItemValue: 0,
      profitMargin: 0,
      conversionRate: 0
    };
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
  const totalCosts = sales.reduce((sum, sale) => sum + (sale.inventory_items.cost_basis * sale.quantity), 0);
  const totalProfit = totalRevenue - totalCosts;
  const itemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const orders = sales.length;

  return {
    totalRevenue,
    totalProfit,
    totalCosts,
    itemsSold,
    orders,
    avgOrderValue: totalRevenue / orders,
    avgItemValue: totalRevenue / itemsSold,
    profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    conversionRate: 0 // Would need view/impression data to calculate
  };
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}