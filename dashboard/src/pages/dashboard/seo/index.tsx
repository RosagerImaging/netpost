import { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { withAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import {
  MagnifyingGlassIcon,
  LightBulbIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  TagIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { Platform, InventoryItem } from '@/types'
import clsx from 'clsx'

function SEOAnalysisPage() {
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.EBAY)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  // Fetch inventory items for SEO analysis
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    'inventory-for-seo',
    () => apiClient.getInventory({ limit: 100 }),
    { retry: false }
  )

  // Fetch previous SEO analyses
  const { data: analysesData, isLoading: analysesLoading } = useQuery(
    'seo-analyses',
    () => apiClient.get('/seo/analyses'),
    { retry: false }
  )

  // Analyze SEO mutation
  const analyzeMutation = useMutation(
    ({ itemId, platform }: { itemId: string; platform: Platform }) =>
      apiClient.analyzeSEO(itemId, platform),
    {
      onSuccess: (response) => {
        if (response.success) {
          setAnalysisResults(response.data)
        }
      }
    }
  )

  const availableItems = inventoryData?.data?.items || []
  const previousAnalyses = Array.isArray(analysesData?.data) ? analysesData.data : []

  const platforms = [
    { id: Platform.EBAY, name: 'eBay', color: 'bg-blue-500' },
    { id: Platform.MERCARI, name: 'Mercari', color: 'bg-red-500' },
    { id: Platform.POSHMARK, name: 'Poshmark', color: 'bg-pink-500' },
    { id: Platform.FACEBOOK_MARKETPLACE, name: 'Facebook Marketplace', color: 'bg-blue-600' },
    { id: Platform.DEPOP, name: 'Depop', color: 'bg-purple-500' },
    { id: Platform.ETSY, name: 'Etsy', color: 'bg-orange-500' }
  ]

  const handleAnalyze = () => {
    if (selectedItem && selectedPlatform) {
      analyzeMutation.mutate({ itemId: selectedItem, platform: selectedPlatform })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  // Mock analysis results for demonstration
  const mockAnalysisResults = analysisResults || {
    score: 74,
    recommendations: [
      {
        type: 'title',
        priority: 'high',
        message: 'Consider adding more descriptive keywords to your title',
        suggestion: 'Include brand, condition, and key features in the first 50 characters'
      },
      {
        type: 'description',
        priority: 'medium',
        message: 'Your description could be more detailed',
        suggestion: 'Add specific measurements, materials, and condition details'
      },
      {
        type: 'keywords',
        priority: 'high',
        message: 'Missing important keywords for searchability',
        suggestion: 'Include relevant brand names, categories, and search terms'
      },
      {
        type: 'images',
        priority: 'low',
        message: 'Good image quality, consider adding more angles',
        suggestion: 'Add close-up shots of any unique features or flaws'
      }
    ],
    keywordSuggestions: [
      { keyword: 'vintage nike', volume: 12500, difficulty: 'medium', relevance: 95 },
      { keyword: 'nike sneakers', volume: 8900, difficulty: 'high', relevance: 88 },
      { keyword: 'retro shoes', volume: 4200, difficulty: 'low', relevance: 72 },
      { keyword: 'collectible sneakers', volume: 2100, difficulty: 'low', relevance: 85 },
      { keyword: 'athletic footwear', volume: 6700, difficulty: 'medium', relevance: 65 }
    ],
    competitorAnalysis: {
      avgPrice: 125.50,
      priceRange: { min: 89, max: 180 },
      topCompetitors: [
        { title: 'Similar Nike Vintage Sneakers - Size 10', price: 135, sales: 23 },
        { title: 'Retro Nike Air Force - Excellent Condition', price: 145, sales: 18 },
        { title: 'Vintage Athletic Shoes - Nike Brand', price: 110, sales: 15 }
      ]
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SEO Analysis</h1>
            <p className="mt-1 text-sm text-gray-600">
              Optimize your listings for better search visibility and sales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis Form */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Analyze Listing
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Item
                  </label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Choose an item...</option>
                    {availableItems.map((item: InventoryItem) => (
                      <option key={item.id} value={item.id}>
                        {item.title} - {item.sku}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
                    className="input-field"
                  >
                    {platforms.map(platform => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!selectedItem || !selectedPlatform || analyzeMutation.isLoading}
                  className="w-full btn-primary"
                >
                  {analyzeMutation.isLoading ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                      Analyze SEO
                    </>
                  )}
                </button>

                {analyzeMutation.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">
                      {String((analyzeMutation.error as any)?.message) || 'Analysis failed'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Previous Analyses */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Analyses
                </h3>
              </div>
              <div className="card-body">
                {analysesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="spinner"></div>
                  </div>
                ) : previousAnalyses.length === 0 ? (
                  <div className="text-center py-4">
                    <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">No analyses yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {previousAnalyses.slice(0, 5).map((analysis: any) => (
                      <div key={analysis.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {analysis.itemTitle}
                          </p>
                          <p className="text-xs text-gray-500">
                            {analysis.platform} • {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={clsx(
                          'flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full',
                          getScoreBg(analysis.score),
                          getScoreColor(analysis.score)
                        )}>
                          {analysis.score}/100
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {mockAnalysisResults && (
              <>
                {/* SEO Score */}
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        SEO Score
                      </h3>
                      <div className={clsx(
                        'flex items-center px-3 py-1 rounded-full text-sm font-medium',
                        getScoreBg(mockAnalysisResults.score),
                        getScoreColor(mockAnalysisResults.score)
                      )}>
                        <StarIcon className="h-4 w-4 mr-1" />
                        {mockAnalysisResults.score}/100
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                            Overall Score
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={clsx(
                            'text-xs font-semibold inline-block',
                            getScoreColor(mockAnalysisResults.score)
                          )}>
                            {mockAnalysisResults.score >= 80 ? 'Excellent' : 
                             mockAnalysisResults.score >= 60 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${mockAnalysisResults.score}%` }}
                          className={clsx(
                            'shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center',
                            mockAnalysisResults.score >= 80 ? 'bg-green-500' :
                            mockAnalysisResults.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">
                      Optimization Recommendations
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {mockAnalysisResults.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0">
                            {rec.priority === 'high' ? (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : rec.priority === 'medium' ? (
                              <LightBulbIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                            )}
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              {rec.message}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {rec.suggestion}
                            </p>
                            <span className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2',
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            )}>
                              {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Keyword Suggestions */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">
                      Keyword Suggestions
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Keyword
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Search Volume
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Difficulty
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Relevance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {mockAnalysisResults.keywordSuggestions.map((keyword: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {keyword.keyword}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {keyword.volume.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={clsx(
                                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                                  keyword.difficulty === 'low' ? 'bg-green-100 text-green-800' :
                                  keyword.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                )}>
                                  {keyword.difficulty}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${keyword.relevance}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {keyword.relevance}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Competitor Analysis */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">
                      Competitor Analysis
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">Average Price</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${mockAnalysisResults.competitorAnalysis.avgPrice}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">Price Range</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${mockAnalysisResults.competitorAnalysis.priceRange.min} - ${mockAnalysisResults.competitorAnalysis.priceRange.max}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-500">Top Competitors</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {mockAnalysisResults.competitorAnalysis.topCompetitors.length}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Similar Listings</h4>
                      {mockAnalysisResults.competitorAnalysis.topCompetitors.map((competitor: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {competitor.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {competitor.sales} recent sales
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${competitor.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {!mockAnalysisResults && (
              <div className="card">
                <div className="card-body">
                  <div className="text-center py-12">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No Analysis Yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select an item and platform to get started with SEO analysis.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(SEOAnalysisPage)