import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from 'react-query'
import Link from 'next/link'
import { withAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import {
  ArrowPathIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { Platform, InventoryItem } from '@/types'
import clsx from 'clsx'

function CrossListingPage() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [optimizeSEO, setOptimizeSEO] = useState(true)
  const [generateDescriptions, setGenerateDescriptions] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Get pre-selected items from URL
  useEffect(() => {
    if (router.query.items) {
      const items = (router.query.items as string).split(',')
      setSelectedItems(items)
      setShowCreateModal(true)
    }
  }, [router.query.items])

  // Fetch inventory items
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    'inventory-for-crosslisting',
    () => apiClient.getInventory({ limit: 100 }),
    { retry: false }
  )

  // Fetch cross-listing requests
  const { data: requestsData, isLoading: requestsLoading, refetch } = useQuery(
    'crosslisting-requests',
    () => apiClient.get('/crosslisting/requests'),
    { 
      retry: false,
      refetchInterval: 5000 // Poll for updates
    }
  )

  // Create cross-listing mutation
  const createMutation = useMutation(
    (data: {
      sourcePlatform: Platform
      targetPlatforms: Platform[]
      inventoryItems: string[]
      optimizeSEO: boolean
      generateDescriptions: boolean
    }) => apiClient.createCrossListing(data),
    {
      onSuccess: () => {
        setShowCreateModal(false)
        setSelectedItems([])
        setSelectedPlatforms([])
        refetch()
      }
    }
  )

  const availableItems = inventoryData?.data?.items || []
  const requests = Array.isArray(requestsData?.data) ? requestsData.data : []

  const handleCreateCrossListing = () => {
    if (selectedItems.length === 0 || selectedPlatforms.length === 0) {
      return
    }

    createMutation.mutate({
      sourcePlatform: Platform.EBAY, // Default source platform
      targetPlatforms: selectedPlatforms,
      inventoryItems: selectedItems,
      optimizeSEO,
      generateDescriptions
    })
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const platforms = [
    { id: Platform.EBAY, name: 'eBay', color: 'bg-blue-500', icon: '🏪' },
    { id: Platform.MERCARI, name: 'Mercari', color: 'bg-red-500', icon: '🛍️' },
    { id: Platform.POSHMARK, name: 'Poshmark', color: 'bg-pink-500', icon: '👗' },
    { id: Platform.FACEBOOK_MARKETPLACE, name: 'Facebook Marketplace', color: 'bg-blue-600', icon: '📱' },
    { id: Platform.DEPOP, name: 'Depop', color: 'bg-purple-500', icon: '🎨' },
    { id: Platform.ETSY, name: 'Etsy', color: 'bg-orange-500', icon: '🎭' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={clsx(
        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
        config.bg,
        config.text
      )}>
        {config.label}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cross-listing</h1>
            <p className="mt-1 text-sm text-gray-600">
              List your items across multiple platforms automatically
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Cross-listing
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowPathIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Requests
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {requests.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {requests.filter((r: any) => r.status === 'completed').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      In Progress
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {requests.filter((r: any) => ['pending', 'in_progress'].includes(r.status)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Cross-listing Requests
              </h3>
              <button
                onClick={() => refetch()}
                className="btn-secondary text-sm"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cross-listing requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first cross-listing request.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platforms
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(request.status)}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                Request #{request.id.slice(-8)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.optimize_seo && 'SEO Optimized'} 
                                {request.optimize_seo && request.generate_descriptions && ' • '}
                                {request.generate_descriptions && 'AI Descriptions'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.inventory_items?.length || 0} item{(request.inventory_items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex -space-x-1">
                            {request.target_platforms?.slice(0, 3).map((platform: Platform) => {
                              const platformInfo = platforms.find(p => p.id === platform)
                              return (
                                <div
                                  key={platform}
                                  className={clsx(
                                    'inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-xs',
                                    platformInfo?.color || 'bg-gray-500'
                                  )}
                                  title={platformInfo?.name}
                                >
                                  {platformInfo?.icon}
                                </div>
                              )
                            })}
                            {(request.target_platforms?.length || 0) > 3 && (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border-2 border-white text-xs text-gray-600">
                                +{(request.target_platforms?.length || 0) - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Cross-listing Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create Cross-listing Request
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Select Items */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Select Items ({selectedItems.length})
                    </h4>
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {inventoryLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="spinner"></div>
                        </div>
                      ) : availableItems.length === 0 ? (
                        <div className="text-center py-8">
                          <CubeIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-500 mt-2">No items available</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {availableItems.map((item: InventoryItem) => (
                            <div key={item.id} className="p-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleItemToggle(item.id)}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="ml-3 flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    {item.images?.[0] ? (
                                      <img
                                        className="h-8 w-8 rounded object-cover"
                                        src={item.images[0]}
                                        alt={item.title}
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                                        <CubeIcon className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ${item.retailPrice} • {item.sku}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Platforms */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Select Platforms ({selectedPlatforms.length})
                    </h4>
                    <div className="space-y-3">
                      {platforms.map(platform => (
                        <label
                          key={platform.id}
                          className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform.id)}
                            onChange={() => handlePlatformToggle(platform.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="ml-3 flex items-center">
                            <div
                              className={clsx(
                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
                                platform.color
                              )}
                            >
                              {platform.icon}
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              {platform.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Options */}
                    <div className="mt-6 space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={optimizeSEO}
                          onChange={(e) => setOptimizeSEO(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Optimize for SEO
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={generateDescriptions}
                          onChange={(e) => setGenerateDescriptions(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Generate AI descriptions
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCrossListing}
                    disabled={selectedItems.length === 0 || selectedPlatforms.length === 0 || createMutation.isLoading}
                    className="btn-primary"
                  >
                    {createMutation.isLoading ? (
                      <>
                        <div className="spinner mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Cross-listing'
                    )}
                  </button>
                </div>

                {createMutation.error ? (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">
                      {String((createMutation.error as any)?.message) || 'Failed to create cross-listing'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default withAuth(CrossListingPage)