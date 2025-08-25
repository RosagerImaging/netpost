import { useAuth, withAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  CubeIcon, 
  ArrowPathIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { useQuery } from 'react-query'
import { apiClient } from '@/lib/api'
import Link from 'next/link'

function Dashboard() {
  const { user } = useAuth()

  // Fetch dashboard data
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    'inventory-summary',
    () => apiClient.getInventory({ limit: 5 }),
    { retry: false }
  )

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    'analytics-summary',
    () => apiClient.getAnalytics(),
    { retry: false }
  )

  const stats = [
    {
      name: 'Total Items',
      stat: inventoryData?.data?.pagination?.total || 0,
      icon: CubeIcon,
      change: '+4.75%',
      changeType: 'increase',
      href: '/dashboard/inventory'
    },
    {
      name: 'Active Listings',
      stat: '24',
      icon: ShoppingBagIcon,
      change: '+2.02%',
      changeType: 'increase',
      href: '/dashboard/inventory'
    },
    {
      name: 'This Month Revenue',
      stat: '$12,426',
      icon: CurrencyDollarIcon,
      change: '+15.3%',
      changeType: 'increase',
      href: '/dashboard/analytics'
    },
    {
      name: 'Cross-listings',
      stat: '8',
      icon: ArrowPathIcon,
      change: '+3.1%',
      changeType: 'increase',
      href: '/dashboard/cross-listing'
    },
  ]

  const recentItems = inventoryData?.data?.items || []

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-success-400 to-success-600 rounded-2xl flex items-center justify-center shadow-soft">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h2 className="heading-primary">
                Welcome back, {user?.firstName || 'User'}!
              </h2>
              <p className="text-muted">
                Here&apos;s your business performance overview
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div key={item.name} className="card hover-lift group">
              <div className="card-body relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-primary-100/50 to-transparent rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-soft",
                        index === 0 ? "bg-gradient-to-br from-primary-500 to-primary-600" :
                        index === 1 ? "bg-gradient-to-br from-success-500 to-success-600" :
                        index === 2 ? "bg-gradient-to-br from-premium-500 to-premium-600" :
                        "bg-gradient-to-br from-coral-500 to-coral-600"
                      )}>
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted">
                          {item.name}
                        </p>
                        <p className="text-2xl font-bold text-primary-900">
                          {item.stat}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className={clsx(
                          "text-sm font-semibold",
                          item.changeType === 'increase' ? 'text-success-600' : 'text-coral-600'
                        )}>
                          {item.change}
                        </span>
                        <span className="text-xs text-muted">vs last month</span>
                      </div>
                      
                      <Link
                        href={item.href}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Items - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="heading-secondary">
                      Recent Inventory Items
                    </h3>
                    <p className="text-sm text-muted">Your latest product additions</p>
                  </div>
                  <Link
                    href="/dashboard/inventory/new"
                    className="btn-primary"
                  >
                    <CubeIcon className="h-4 w-4 mr-2" />
                    Add Item
                  </Link>
                </div>
              </div>
              <div className="card-body p-0">
                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="spinner-modern h-8 w-8"></div>
                  </div>
                ) : recentItems.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {recentItems.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="px-8 py-4 hover:bg-primary-50/50 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {item.images && item.images[0] ? (
                                <img
                                  className="h-12 w-12 rounded-xl object-cover shadow-soft"
                                  src={item.images[0]}
                                  alt={item.title}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-soft">
                                  <CubeIcon className="h-6 w-6 text-primary-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-primary-900 truncate group-hover:text-primary-700">
                                {item.title}
                              </div>
                              <div className="text-sm text-muted">
                                SKU: {item.sku}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-900">
                              ${item.retail_price}
                            </div>
                            <div className="text-xs text-muted">
                              Stock: {item.quantity_available || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-8 py-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CubeIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">No inventory items yet</h3>
                    <p className="text-muted mb-6">Get started by adding your first product to the inventory.</p>
                    <Link
                      href="/dashboard/inventory/new"
                      className="btn-primary"
                    >
                      <CubeIcon className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Link>
                  </div>
                )}
                {recentItems.length > 0 && (
                  <div className="px-8 py-4 bg-primary-50/30 border-t border-neutral-100">
                    <Link href="/dashboard/inventory" className="font-semibold text-primary-600 hover:text-primary-700 text-sm transition-colors">
                      View all inventory ({inventoryData?.data?.pagination?.total || 0}) →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <div className="card-header border-b border-neutral-100">
                <h3 className="heading-secondary">Quick Actions</h3>
                <p className="text-sm text-muted">Jump to key tasks</p>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <Link
                    href="/dashboard/inventory/new"
                    className="block p-4 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CubeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-primary-900 group-hover:text-primary-700">Add Item</p>
                        <p className="text-sm text-muted">Create new inventory</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/cross-listing"
                    className="block p-4 rounded-xl border-2 border-dashed border-success-200 hover:border-success-300 hover:bg-success-50/50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ArrowPathIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-primary-900 group-hover:text-success-700">Cross-list</p>
                        <p className="text-sm text-muted">Multi-platform listings</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/analytics"
                    className="block p-4 rounded-xl border-2 border-dashed border-premium-200 hover:border-premium-300 hover:bg-premium-50/50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-premium-500 to-premium-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ChartBarIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-primary-900 group-hover:text-premium-700">Analytics</p>
                        <p className="text-sm text-muted">Sales performance</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/seo"
                    className="block p-4 rounded-xl border-2 border-dashed border-coral-200 hover:border-coral-300 hover:bg-coral-50/50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-coral-500 to-coral-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-primary-900 group-hover:text-coral-700">SEO Optimize</p>
                        <p className="text-sm text-muted">Improve visibility</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-premium-500 to-premium-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary-900">Account Status</h4>
                    <p className="text-sm text-muted">Current subscription tier</p>
                  </div>
                </div>

                <div className={clsx(
                  "p-3 rounded-lg border text-sm",
                  user?.subscriptionTier === 'enterprise' ? "bg-premium-50 border-premium-200" :
                  user?.subscriptionTier === 'professional' ? "bg-primary-50 border-primary-200" :
                  user?.subscriptionTier === 'starter' ? "bg-success-50 border-success-200" :
                  "bg-yellow-50 border-yellow-200"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-primary-900">
                      {user?.subscriptionTier?.toUpperCase() || 'TRIAL'} Plan
                    </span>
                    <span className={clsx(
                      "badge text-xs font-bold",
                      user?.subscriptionTier === 'enterprise' ? "badge-premium" :
                      user?.subscriptionTier === 'professional' ? "badge-primary" :
                      user?.subscriptionTier === 'starter' ? "badge-success" :
                      "badge-warning"
                    )}>
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-muted text-xs">
                    {user?.subscriptionTier === 'trial' && "14 days remaining in trial"}
                    {user?.subscriptionTier === 'starter' && "Unlimited listings included"}
                    {user?.subscriptionTier === 'professional' && "Advanced features enabled"}
                    {user?.subscriptionTier === 'enterprise' && "Full enterprise access"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trial/Subscription Banner */}
        {user?.subscriptionTier === 'trial' && (
          <div className="card-premium animate-slide-up">
            <div className="card-body">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-premium-500 to-premium-600 rounded-xl flex items-center justify-center shadow-soft">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="heading-secondary text-primary-900 mb-2">
                    🚀 Unlock Your Full Potential
                  </h3>
                  <p className="text-muted mb-4">
                    You're currently on a trial account. Upgrade to access unlimited inventory items, 
                    advanced analytics, cross-listing to 50+ platforms, and priority support.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/dashboard/settings/billing"
                      className="btn-premium"
                    >
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                      Upgrade to Professional
                    </Link>
                    <button className="btn-ghost text-primary-700">
                      Learn More About Plans
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default withAuth(Dashboard)