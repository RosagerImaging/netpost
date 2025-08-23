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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Here&apos;s what&apos;s happening with your inventory today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.name} className="card overflow-hidden">
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
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {item.stat}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href={item.href} className="font-medium text-primary-600 hover:text-primary-500">
                    View all
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Inventory Items
              </h3>
            </div>
            <div className="card-body p-0">
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner"></div>
                </div>
              ) : recentItems.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentItems.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {item.images && item.images[0] ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={item.images[0]}
                              alt={item.title}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <CubeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        ${item.retail_price}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first inventory item.</p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/inventory/new"
                      className="btn-primary"
                    >
                      Add Item
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {recentItems.length > 0 && (
              <div className="bg-gray-50 px-6 py-3">
                <div className="text-sm">
                  <Link href="/dashboard/inventory" className="font-medium text-primary-600 hover:text-primary-500">
                    View all inventory <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/inventory/new"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="flex-shrink-0">
                    <CubeIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" />
                    <p className="text-sm font-medium text-gray-900">Add Item</p>
                    <p className="text-sm text-gray-500">Create new inventory</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/cross-listing"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="flex-shrink-0">
                    <ArrowPathIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" />
                    <p className="text-sm font-medium text-gray-900">Cross-list</p>
                    <p className="text-sm text-gray-500">List on multiple platforms</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/analytics"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" />
                    <p className="text-sm font-medium text-gray-900">View Analytics</p>
                    <p className="text-sm text-gray-500">Sales performance</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/seo"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" />
                    <p className="text-sm font-medium text-gray-900">SEO Analysis</p>
                    <p className="text-sm text-gray-500">Optimize listings</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trial/Subscription Banner */}
        {user?.subscriptionTier === 'trial' && (
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  You&apos;re on a trial account
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Upgrade to unlock unlimited inventory items, advanced analytics, and priority support.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      href="/dashboard/settings/billing"
                      className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
                    >
                      Upgrade now
                    </Link>
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