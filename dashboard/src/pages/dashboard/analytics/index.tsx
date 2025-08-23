import { useState } from 'react'
import { useQuery } from 'react-query'
import { withAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingBagIcon,
  CalendarIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import clsx from 'clsx'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery(
    ['analytics', dateRange],
    () => apiClient.getAnalytics({
      startDate: getStartDate(dateRange),
      endDate: new Date().toISOString()
    }),
    { retry: false }
  )

  // Fetch sales data for charts
  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['sales-data', dateRange],
    () => apiClient.getSalesData({
      startDate: getStartDate(dateRange),
      endDate: new Date().toISOString(),
      granularity: dateRange === '7d' ? 'day' : dateRange === '30d' ? 'day' : 'week'
    }),
    { retry: false }
  )

  function getStartDate(range: string): string {
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return startDate.toISOString()
  }

  const analytics = analyticsData?.data || {}
  const sales = Array.isArray(salesData?.data) ? salesData.data : []

  // Mock data for demonstration
  const mockSalesData = sales.length > 0 ? sales : [
    { date: '2024-01-01', revenue: 1200, profit: 400, orders: 15 },
    { date: '2024-01-02', revenue: 1800, profit: 600, orders: 22 },
    { date: '2024-01-03', revenue: 2100, profit: 750, orders: 28 },
    { date: '2024-01-04', revenue: 1600, profit: 520, orders: 19 },
    { date: '2024-01-05', revenue: 2400, profit: 850, orders: 31 },
    { date: '2024-01-06', revenue: 1900, profit: 650, orders: 24 },
    { date: '2024-01-07', revenue: 2200, profit: 780, orders: 29 }
  ]

  const mockPlatformData = [
    { name: 'eBay', value: 35, sales: 4200 },
    { name: 'Mercari', value: 25, sales: 3000 },
    { name: 'Poshmark', value: 20, sales: 2400 },
    { name: 'Facebook', value: 15, sales: 1800 },
    { name: 'Depop', value: 5, sales: 600 }
  ]

  const mockCategoryData = [
    { name: 'Clothing', revenue: 5800, profit: 2030 },
    { name: 'Electronics', revenue: 4200, profit: 1680 },
    { name: 'Accessories', revenue: 2100, profit: 840 },
    { name: 'Home', revenue: 1800, profit: 540 },
    { name: 'Other', revenue: 1100, profit: 330 }
  ]

  // Calculate summary stats
  const totalRevenue = mockSalesData.reduce((sum, day) => sum + day.revenue, 0)
  const totalProfit = mockSalesData.reduce((sum, day) => sum + day.profit, 0)
  const totalOrders = mockSalesData.reduce((sum, day) => sum + day.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const prevPeriodRevenue = totalRevenue * 0.85 // Mock previous period
  const revenueChange = prevPeriodRevenue > 0 ? ((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100 : 0

  const prevPeriodProfit = totalProfit * 0.82
  const profitChange = prevPeriodProfit > 0 ? ((totalProfit - prevPeriodProfit) / prevPeriodProfit) * 100 : 0

  const prevPeriodOrders = totalOrders * 0.92
  const ordersChange = prevPeriodOrders > 0 ? ((totalOrders - prevPeriodOrders) / prevPeriodOrders) * 100 : 0

  const stats = [
    {
      name: 'Total Revenue',
      value: totalRevenue,
      change: revenueChange,
      changeType: revenueChange >= 0 ? 'increase' : 'decrease',
      icon: CurrencyDollarIcon,
      format: 'currency'
    },
    {
      name: 'Total Profit',
      value: totalProfit,
      change: profitChange,
      changeType: profitChange >= 0 ? 'increase' : 'decrease',
      icon: ArrowTrendingUpIcon,
      format: 'currency'
    },
    {
      name: 'Total Orders',
      value: totalOrders,
      change: ordersChange,
      changeType: ordersChange >= 0 ? 'increase' : 'decrease',
      icon: ShoppingBagIcon,
      format: 'number'
    },
    {
      name: 'Avg Order Value',
      value: avgOrderValue,
      change: 5.2,
      changeType: 'increase',
      icon: ChartBarIcon,
      format: 'currency'
    }
  ]

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return `$${value.toFixed(2)}`
    }
    return value.toString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track your sales performance and business metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={() => refetch()}
              className="btn-secondary flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatValue(item.value, item.format)}
                        </div>
                        <div className={clsx(
                          'ml-2 flex items-baseline text-sm font-semibold',
                          item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {item.changeType === 'increase' ? (
                            <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">
                            {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                          </span>
                          {Math.abs(item.change).toFixed(1)}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Revenue Trend
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="profit">Profit</option>
                    <option value="orders">Orders</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      selectedMetric === 'revenue' || selectedMetric === 'profit' 
                        ? `$${value}` 
                        : value,
                      name === selectedMetric ? name.charAt(0).toUpperCase() + name.slice(1) : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Platform Breakdown
              </h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockPlatformData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockPlatformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Category Performance
            </h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={mockCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                <Bar dataKey="profit" fill="#10B981" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Top Performing Items
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {[
                  { name: 'Vintage Nike Sneakers', sales: 8, revenue: 1200 },
                  { name: 'iPhone 13 Case', sales: 15, revenue: 900 },
                  { name: 'Designer Handbag', sales: 3, revenue: 800 },
                  { name: 'Gaming Headset', sales: 12, revenue: 720 },
                  { name: 'Workout Clothing Set', sales: 6, revenue: 600 }
                ].map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.sales} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${item.revenue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Key Insights
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Strong Growth
                    </p>
                    <p className="text-sm text-gray-500">
                      Revenue increased by {revenueChange.toFixed(1)}% compared to the previous period
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Best Platform
                    </p>
                    <p className="text-sm text-gray-500">
                      eBay generates the highest revenue at 35% of total sales
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ShoppingBagIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Popular Category
                    </p>
                    <p className="text-sm text-gray-500">
                      Clothing items account for the highest revenue per category
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Optimization Tip
                    </p>
                    <p className="text-sm text-gray-500">
                      Consider increasing inventory for top-performing categories
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export & Actions */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Export Data
                </h3>
                <p className="text-sm text-gray-500">
                  Download your analytics data for further analysis
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="btn-secondary">
                  Export CSV
                </button>
                <button className="btn-secondary">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(AnalyticsPage)