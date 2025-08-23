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
      endDate
    } = req.query;

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get analytics data using the database function
    const { data: analyticsData, error: analyticsError } = await supabaseAdmin
      .rpc('calculate_user_analytics', {
        p_user_id: user.id,
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString()
      });

    if (analyticsError) {
      console.error('Failed to get analytics data:', analyticsError);
      throw new Error('Failed to fetch analytics data');
    }

    // Get inventory metrics
    const { data: inventoryMetrics, error: inventoryError } = await supabaseAdmin
      .rpc('get_inventory_metrics', { p_user_id: user.id });

    if (inventoryError) {
      console.error('Failed to get inventory metrics:', inventoryError);
    }

    // Get recent sales
    const { data: recentSales, error: salesError } = await supabaseAdmin
      .from('marketplace_listings')
      .select(`
        *,
        inventory_items!inner(
          user_id,
          title,
          category,
          cost_basis
        )
      `)
      .eq('inventory_items.user_id', user.id)
      .eq('status', 'sold')
      .gte('last_updated', start.toISOString())
      .lte('last_updated', end.toISOString())
      .order('last_updated', { ascending: false })
      .limit(10);

    if (salesError) {
      console.error('Failed to get recent sales:', salesError);
    }

    // Get top performing categories
    const { data: categoryPerformance, error: categoryError } = await supabaseAdmin
      .from('marketplace_listings')
      .select(`
        price,
        quantity,
        inventory_items!inner(
          user_id,
          category,
          cost_basis
        )
      `)
      .eq('inventory_items.user_id', user.id)
      .eq('status', 'sold')
      .gte('last_updated', start.toISOString())
      .lte('last_updated', end.toISOString());

    if (categoryError) {
      console.error('Failed to get category performance:', categoryError);
    }

    // Process category data
    const categoryStats = categoryPerformance?.reduce((acc: any, sale: any) => {
      const category = sale.inventory_items.category;
      if (!acc[category]) {
        acc[category] = {
          revenue: 0,
          profit: 0,
          itemsSold: 0,
          avgPrice: 0
        };
      }
      
      const revenue = sale.price * sale.quantity;
      const profit = revenue - (sale.inventory_items.cost_basis * sale.quantity);
      
      acc[category].revenue += revenue;
      acc[category].profit += profit;
      acc[category].itemsSold += sale.quantity;
      
      return acc;
    }, {}) || {};

    // Calculate average prices
    Object.keys(categoryStats).forEach(category => {
      if (categoryStats[category].itemsSold > 0) {
        categoryStats[category].avgPrice = categoryStats[category].revenue / categoryStats[category].itemsSold;
      }
    });

    // Get platform performance trends (last 7 days)
    const trendStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: platformTrends, error: trendsError } = await supabaseAdmin
      .from('marketplace_listings')
      .select(`
        platform,
        price,
        quantity,
        last_updated,
        inventory_items!inner(user_id)
      `)
      .eq('inventory_items.user_id', user.id)
      .eq('status', 'sold')
      .gte('last_updated', trendStart.toISOString())
      .order('last_updated', { ascending: true });

    if (trendsError) {
      console.error('Failed to get platform trends:', trendsError);
    }

    // Process trends data by day
    const dailyTrends = platformTrends?.reduce((acc: any, sale: any) => {
      const date = new Date(sale.last_updated).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          itemsSold: 0,
          platforms: {}
        };
      }
      
      const revenue = sale.price * sale.quantity;
      acc[date].revenue += revenue;
      acc[date].itemsSold += sale.quantity;
      
      if (!acc[date].platforms[sale.platform]) {
        acc[date].platforms[sale.platform] = {
          revenue: 0,
          itemsSold: 0
        };
      }
      
      acc[date].platforms[sale.platform].revenue += revenue;
      acc[date].platforms[sale.platform].itemsSold += sale.quantity;
      
      return acc;
    }, {}) || {};

    const trendsArray = Object.values(dailyTrends).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: analyticsData?.total_revenue || 0,
          totalProfit: analyticsData?.total_profit || 0,
          totalCosts: analyticsData?.total_costs || 0,
          itemsSold: analyticsData?.items_sold || 0,
          averageSellingPrice: analyticsData?.average_selling_price || 0,
          averageDaysToSell: analyticsData?.average_days_to_sell || 0,
          platformBreakdown: analyticsData?.platform_breakdown || {},
          categoryBreakdown: analyticsData?.category_breakdown || {}
        },
        inventory: {
          totalItems: inventoryMetrics?.total_items || 0,
          activeListings: inventoryMetrics?.active_listings || 0,
          soldItems: inventoryMetrics?.sold_items || 0,
          draftItems: inventoryMetrics?.draft_items || 0,
          totalValue: inventoryMetrics?.total_value || 0,
          averageCostBasis: inventoryMetrics?.average_cost_basis || 0
        },
        recentSales: recentSales?.map(sale => ({
          id: sale.id,
          title: sale.inventory_items.title,
          platform: sale.platform,
          price: sale.price,
          quantity: sale.quantity,
          revenue: sale.price * sale.quantity,
          profit: (sale.price * sale.quantity) - (sale.inventory_items.cost_basis * sale.quantity),
          soldAt: sale.last_updated,
          category: sale.inventory_items.category
        })) || [],
        categoryPerformance: categoryStats,
        trends: trendsArray,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });
  } catch (error) {
    handleError(error, res);
  }
}