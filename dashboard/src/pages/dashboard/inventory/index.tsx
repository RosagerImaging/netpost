import { useState } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { withAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import clsx from 'clsx'

function InventoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const limit = 20

  // Fetch inventory data
  const { data, isLoading, error } = useQuery(
    ['inventory', currentPage, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder],
    () => apiClient.getInventory({
      page: currentPage,
      limit,
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      sortBy,
      sortOrder
    }),
    { retry: false, keepPreviousData: true }
  )

  // Delete mutation
  const deleteMutation = useMutation(
    (id: string) => apiClient.deleteInventoryItem(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory')
        // Show success toast
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.success('Item deleted successfully')
        }
      },
      onError: (error: any) => {
        // Show error toast
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.error(error.message || 'Failed to delete item')
        }
      }
    }
  )

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const resetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  const inventoryItems = data?.data?.items || []
  const pagination = data?.data?.pagination

  const statusColors = {
    'active': 'bg-green-100 text-green-800',
    'draft': 'bg-yellow-100 text-yellow-800',
    'sold': 'bg-blue-100 text-blue-800',
    'archived': 'bg-gray-100 text-gray-800',
    'grayed_out': 'bg-red-100 text-red-800',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
            <p className="text-sm text-gray-600">
              Manage your product inventory and listings
            </p>
          </div>
          <Link
            href="/dashboard/inventory/new"
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Item
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Search by title, SKU..."
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="mt-1 input-field"
                  >
                    <option value="">All Categories</option>
                    <option value="clothing">Clothing</option>
                    <option value="electronics">Electronics</option>
                    <option value="home">Home & Garden</option>
                    <option value="books">Books</option>
                    <option value="toys">Toys & Games</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 input-field"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="sold">Sold</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                    Sort By
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}
                    className="mt-1 input-field"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="retail_price-desc">Price High-Low</option>
                    <option value="retail_price-asc">Price Low-High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-outline"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card">
          <div className="overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500">Error loading inventory</div>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="text-center py-12">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || categoryFilter || statusFilter
                    ? 'No items match your current filters.'
                    : 'Get started by creating your first inventory item.'}
                </p>
                <div className="mt-6">
                  {searchTerm || categoryFilter || statusFilter ? (
                    <button onClick={resetFilters} className="btn-outline">
                      Clear Filters
                    </button>
                  ) : (
                    <Link href="/dashboard/inventory/new" className="btn-primary">
                      Add Item
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryItems.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {item.images && item.images[0] ? (
                                  <img
                                    className="h-10 w-10 rounded-lg object-cover"
                                    src={item.images[0]}
                                    alt={item.title}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <CubeIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.brand && `${item.brand} • `}{item.condition}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.retail_price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity_available} / {item.quantity_total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={clsx(
                              'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                              statusColors[item.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            )}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Link
                              href={`/dashboard/inventory/${item.id}`}
                              className="text-primary-600 hover:text-primary-900"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/dashboard/inventory/${item.id}/edit`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                              disabled={deleteMutation.isLoading}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn-outline"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="btn-outline ml-3"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(currentPage - 1) * limit + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * limit, pagination.total)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(page => 
                              page === 1 || 
                              page === pagination.totalPages || 
                              Math.abs(page - currentPage) <= 2
                            )
                            .map((page, index, array) => (
                              <div key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={clsx(
                                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                                    page === currentPage
                                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  )}
                                >
                                  {page}
                                </button>
                              </div>
                            ))}
                          <button
                            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                            disabled={currentPage === pagination.totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(InventoryPage)