import { useState } from 'react'
import { useRouter } from 'next/router'
import { useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { withAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import {
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { ItemCondition, InventoryItemFormData } from '@/types'
import clsx from 'clsx'

function NewInventoryItem() {
  const router = useRouter()
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageUploadError, setImageUploadError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm<InventoryItemFormData>({
    defaultValues: {
      title: '',
      description: '',
      images: [],
      sku: '',
      barcode: '',
      costBasis: 0,
      retailPrice: 0,
      quantityTotal: 1,
      quantityAvailable: 1,
      category: '',
      brand: '',
      condition: ItemCondition.NEW,
      size: '',
      color: '',
      material: '',
      weight: 0,
      dimensions: undefined
    }
  })

  // Watch values for calculations
  const costBasis = watch('costBasis')
  const retailPrice = watch('retailPrice')
  const quantityTotal = watch('quantityTotal')

  // Create inventory item mutation
  const createMutation = useMutation(
    (data: InventoryItemFormData) => apiClient.createInventoryItem(data),
    {
      onSuccess: (response) => {
        if (response.success) {
          router.push('/dashboard/inventory')
        }
      },
      onError: (error: any) => {
        console.error('Failed to create inventory item:', error)
      }
    }
  )

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:')
    if (url && url.trim()) {
      const newUrls = [...imageUrls, url.trim()]
      setImageUrls(newUrls)
      setValue('images', newUrls)
      setImageUploadError('')
    }
  }

  const handleImageRemove = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index)
    setImageUrls(newUrls)
    setValue('images', newUrls)
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomString = Math.random().toString(36).substring(2, 5).toUpperCase()
    const sku = `NP-${randomString}-${timestamp}`
    setValue('sku', sku)
  }

  const onSubmit = async (data: InventoryItemFormData) => {
    // Update images from state
    data.images = imageUrls

    // Ensure quantities are valid
    if (data.quantityAvailable > data.quantityTotal) {
      data.quantityAvailable = data.quantityTotal
    }

    await createMutation.mutateAsync(data)
  }

  const categories = [
    { value: 'clothing', label: 'Clothing & Accessories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'books', label: 'Books & Media' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'collectibles', label: 'Collectibles' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'health', label: 'Health & Beauty' },
    { value: 'other', label: 'Other' }
  ]

  const conditions = [
    { value: ItemCondition.NEW, label: 'New' },
    { value: ItemCondition.USED_LIKE_NEW, label: 'Used - Like New' },
    { value: ItemCondition.USED_GOOD, label: 'Used - Good' },
    { value: ItemCondition.USED_FAIR, label: 'Used - Fair' },
    { value: ItemCondition.USED_POOR, label: 'Used - Poor' },
    { value: ItemCondition.FOR_PARTS, label: 'For Parts' }
  ]

  // Calculate potential profit
  const potentialProfit = retailPrice - costBasis
  const profitMargin = retailPrice > 0 ? ((potentialProfit / retailPrice) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="btn-secondary flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a new inventory item for your store
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      {...register('title', { required: 'Title is required' })}
                      className={clsx('input-field', errors.title && 'border-red-500')}
                      placeholder="Enter item title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      rows={4}
                      {...register('description', { required: 'Description is required' })}
                      className={clsx('input-field', errors.description && 'border-red-500')}
                      placeholder="Describe the item, its condition, features, etc."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className={clsx('input-field', errors.category && 'border-red-500')}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition *
                      </label>
                      <select
                        {...register('condition', { required: 'Condition is required' })}
                        className={clsx('input-field', errors.condition && 'border-red-500')}
                      >
                        {conditions.map(condition => (
                          <option key={condition.value} value={condition.value}>
                            {condition.label}
                          </option>
                        ))}
                      </select>
                      {errors.condition && (
                        <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        {...register('brand')}
                        className="input-field"
                        placeholder="e.g., Nike, Apple"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        {...register('size')}
                        className="input-field"
                        placeholder="e.g., Medium, 10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        {...register('color')}
                        className="input-field"
                        placeholder="e.g., Blue, Black"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Images</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.svg'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleImageRemove(index)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleImageUrlAdd}
                          className="btn-primary"
                        >
                          Add Image URL
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Add product images to help buyers see your item
                      </p>
                      {imageUploadError && (
                        <p className="mt-2 text-sm text-red-600">{imageUploadError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                </div>
                <div className="card-body space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU *
                        <button
                          type="button"
                          onClick={generateSKU}
                          className="ml-2 text-xs text-primary-600 hover:text-primary-700"
                        >
                          Generate
                        </button>
                      </label>
                      <input
                        type="text"
                        {...register('sku', { required: 'SKU is required' })}
                        className={clsx('input-field', errors.sku && 'border-red-500')}
                        placeholder="Enter SKU or click generate"
                      />
                      {errors.sku && (
                        <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        {...register('barcode')}
                        className="input-field"
                        placeholder="UPC/EAN barcode"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      {...register('material')}
                      className="input-field"
                      placeholder="e.g., Cotton, Stainless Steel"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (lbs)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('weight', { valueAsNumber: true })}
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Length (in)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('dimensions.length', { valueAsNumber: true })}
                        className="input-field"
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width (in)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('dimensions.width', { valueAsNumber: true })}
                        className="input-field"
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (in)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('dimensions.height', { valueAsNumber: true })}
                        className="input-field"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing & Inventory */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Pricing & Inventory</h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Basis *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('costBasis', { 
                        required: 'Cost basis is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Cost basis cannot be negative' }
                      })}
                      className={clsx('input-field', errors.costBasis && 'border-red-500')}
                      placeholder="0.00"
                    />
                    {errors.costBasis && (
                      <p className="mt-1 text-sm text-red-600">{errors.costBasis.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retail Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('retailPrice', { 
                        required: 'Retail price is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Retail price cannot be negative' }
                      })}
                      className={clsx('input-field', errors.retailPrice && 'border-red-500')}
                      placeholder="0.00"
                    />
                    {errors.retailPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.retailPrice.message}</p>
                    )}
                  </div>

                  {/* Profit Calculation */}
                  {(costBasis > 0 || retailPrice > 0) && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Potential Profit:</span>
                        <span className={clsx(
                          'font-medium',
                          potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          ${potentialProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className={clsx(
                          'font-medium',
                          profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Quantity *
                      </label>
                      <input
                        type="number"
                        {...register('quantityTotal', { 
                          required: 'Quantity is required',
                          valueAsNumber: true,
                          min: { value: 1, message: 'Must have at least 1 item' }
                        })}
                        className={clsx('input-field', errors.quantityTotal && 'border-red-500')}
                        placeholder="1"
                      />
                      {errors.quantityTotal && (
                        <p className="mt-1 text-xs text-red-600">{errors.quantityTotal.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Available *
                      </label>
                      <input
                        type="number"
                        {...register('quantityAvailable', { 
                          required: 'Available quantity is required',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Available quantity cannot be negative' },
                          max: { value: quantityTotal, message: 'Cannot exceed total quantity' }
                        })}
                        className={clsx('input-field', errors.quantityAvailable && 'border-red-500')}
                        placeholder="1"
                      />
                      {errors.quantityAvailable && (
                        <p className="mt-1 text-xs text-red-600">{errors.quantityAvailable.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <div className="card-body">
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || createMutation.isLoading}
                      className="w-full btn-primary"
                    >
                      {(isSubmitting || createMutation.isLoading) ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Creating Item...
                        </>
                      ) : (
                        'Create Item'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => reset()}
                      className="w-full btn-secondary"
                    >
                      Reset Form
                    </button>
                  </div>

                  {createMutation.error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">
                        {(createMutation.error as any)?.message || 'Failed to create item'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <QuestionMarkCircleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Need Help?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use high-quality images for better sales</li>
                        <li>Include detailed descriptions with keywords</li>
                        <li>Set competitive pricing based on market research</li>
                        <li>Choose the most accurate condition</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(NewInventoryItem)