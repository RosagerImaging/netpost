import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { withAuth, useAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { apiClient } from '@/lib/api'
import {
  UserCircleIcon,
  CogIcon,
  CreditCardIcon,
  LinkIcon,
  BellIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Platform } from '@/types'
import clsx from 'clsx'

const settingsTabs = [
  { name: 'Profile', icon: UserCircleIcon, id: 'profile' },
  { name: 'Preferences', icon: CogIcon, id: 'preferences' },
  { name: 'Platforms', icon: LinkIcon, id: 'platforms' },
  { name: 'Notifications', icon: BellIcon, id: 'notifications' },
  { name: 'Billing', icon: CreditCardIcon, id: 'billing' },
  { name: 'Security', icon: ShieldCheckIcon, id: 'security' }
]

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch user preferences
  const { data: preferencesData, isLoading: preferencesLoading } = useQuery(
    'user-preferences',
    () => apiClient.get('/user/preferences'),
    { retry: false }
  )

  // Fetch platform connections
  const { data: platformsData, isLoading: platformsLoading } = useQuery(
    'platform-connections',
    () => apiClient.get('/user/platforms'),
    { retry: false }
  )

  const preferences = (preferencesData?.data as any) || {
    darkMode: false,
    autoOptimizeSEO: true,
    enableAutoDelisting: true,
    defaultListingDuration: 7,
    emailNotifications: true,
    priceOptimizationEnabled: true,
    aiDescriptionEnabled: true
  }

  const platformConnections = Array.isArray(platformsData?.data) ? platformsData.data : []

  // Update preferences mutation
  const updatePreferencesMutation = useMutation(
    (data: any) => apiClient.put('/user/preferences', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-preferences')
      }
    }
  )

  const platforms = [
    { id: Platform.EBAY, name: 'eBay', color: 'bg-blue-500', description: 'Connect your eBay account for cross-listing' },
    { id: Platform.MERCARI, name: 'Mercari', color: 'bg-red-500', description: 'Sync with Mercari marketplace' },
    { id: Platform.POSHMARK, name: 'Poshmark', color: 'bg-pink-500', description: 'Connect to Poshmark for fashion items' },
    { id: Platform.FACEBOOK_MARKETPLACE, name: 'Facebook Marketplace', color: 'bg-blue-600', description: 'List on Facebook Marketplace' },
    { id: Platform.DEPOP, name: 'Depop', color: 'bg-purple-500', description: 'Connect with Depop community' },
    { id: Platform.ETSY, name: 'Etsy', color: 'bg-orange-500', description: 'Sync with your Etsy shop' }
  ]

  const isPlatformConnected = (platformId: Platform) => {
    return platformConnections.some((conn: any) => conn.platform === platformId && conn.isActive)
  }

  const getPlatformStatus = (platformId: Platform) => {
    const connection = platformConnections.find((conn: any) => conn.platform === platformId)
    if (!connection) return 'disconnected'
    if (!connection.isActive) return 'error'
    return 'connected'
  }

  const handlePreferenceChange = (key: string, value: any) => {
    updatePreferencesMutation.mutate({
      ...preferences,
      [key]: value
    })
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Update your personal information and profile settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            First name
          </label>
          <div className="mt-1">
            <input
              type="text"
              className="input-field"
              defaultValue={user?.firstName || ''}
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Last name
          </label>
          <div className="mt-1">
            <input
              type="text"
              className="input-field"
              defaultValue={user?.lastName || ''}
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              type="email"
              className="input-field"
              defaultValue={user?.email || ''}
              disabled
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Email address cannot be changed. Contact support if you need to update it.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  )

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Application Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize your NetPost experience and automation settings.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Dark Mode</h4>
              <p className="text-sm text-gray-500">Use dark theme across the application</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.darkMode}
                onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Auto-optimize SEO</h4>
              <p className="text-sm text-gray-500">Automatically optimize listings for search engines</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.autoOptimizeSEO}
                onChange={(e) => handlePreferenceChange('autoOptimizeSEO', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">AI-Generated Descriptions</h4>
              <p className="text-sm text-gray-500">Use AI to generate optimized product descriptions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.aiDescriptionEnabled}
                onChange={(e) => handlePreferenceChange('aiDescriptionEnabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Price Optimization</h4>
              <p className="text-sm text-gray-500">Automatically adjust prices based on market trends</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.priceOptimizationEnabled}
                onChange={(e) => handlePreferenceChange('priceOptimizationEnabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Listing Duration
          </label>
          <select
            value={preferences.defaultListingDuration}
            onChange={(e) => handlePreferenceChange('defaultListingDuration', parseInt(e.target.value))}
            className="input-field max-w-xs"
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={10}>10 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderPlatformsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Platform Connections</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect your marketplace accounts to enable cross-listing and synchronization.
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map(platform => {
          const status = getPlatformStatus(platform.id)
          return (
            <div key={platform.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium mr-4',
                      platform.color
                    )}>
                      {platform.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {platform.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {status === 'connected' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : status === 'error' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={clsx(
                        'ml-2 text-sm font-medium',
                        status === 'connected' ? 'text-green-600' :
                        status === 'error' ? 'text-yellow-600' : 'text-gray-500'
                      )}>
                        {status === 'connected' ? 'Connected' :
                         status === 'error' ? 'Error' : 'Not Connected'}
                      </span>
                    </div>
                    <button
                      className={clsx(
                        'btn-primary text-sm',
                        status === 'connected' && 'btn-secondary'
                      )}
                    >
                      {status === 'connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose how and when you want to be notified about important events.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-500">Receive email updates about your account and sales</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.emailNotifications}
              onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Notification Categories
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>New sales and orders</li>
                  <li>Cross-listing completion status</li>
                  <li>SEO analysis results</li>
                  <li>Platform connection issues</li>
                  <li>Account and billing updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Billing & Subscription</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing information.
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
              <p className="text-sm text-gray-500">
                You are currently on the {user?.subscriptionTier?.toUpperCase() || 'TRIAL'} plan
              </p>
            </div>
            <span className={clsx(
              'px-3 py-1 text-sm font-medium rounded-full',
              user?.subscriptionTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
              user?.subscriptionTier === 'professional' ? 'bg-blue-100 text-blue-800' :
              user?.subscriptionTier === 'starter' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            )}>
              {user?.subscriptionTier?.toUpperCase() || 'TRIAL'}
            </span>
          </div>

          {user?.subscriptionTier === 'trial' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Trial Period Active
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your trial period is active. Upgrade to a paid plan to unlock all features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900">Starter</h5>
              <p className="text-2xl font-bold text-gray-900">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-3 text-sm text-gray-500 space-y-1">
                <li>• Up to 100 items</li>
                <li>• 3 platforms</li>
                <li>• Basic analytics</li>
              </ul>
            </div>

            <div className="border-2 border-blue-500 rounded-lg p-4 relative">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                  Popular
                </span>
              </div>
              <h5 className="text-sm font-medium text-gray-900">Professional</h5>
              <p className="text-2xl font-bold text-gray-900">$19.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-3 text-sm text-gray-500 space-y-1">
                <li>• Up to 1,000 items</li>
                <li>• All platforms</li>
                <li>• Advanced analytics</li>
                <li>• AI descriptions</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900">Enterprise</h5>
              <p className="text-2xl font-bold text-gray-900">$49.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-3 text-sm text-gray-500 space-y-1">
                <li>• Unlimited items</li>
                <li>• All platforms</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="btn-primary">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and authentication settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Change Password</h4>
            <p className="text-sm text-gray-500 mb-4">
              Update your password to keep your account secure.
            </p>
            <button className="btn-secondary">
              Change Password
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500 mb-4">
              Add an extra layer of security to your account.
            </p>
            <button className="btn-secondary">
              Enable 2FA
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Active Sessions</h4>
            <p className="text-sm text-gray-500 mb-4">
              View and manage your active login sessions.
            </p>
            <button className="btn-secondary">
              View Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab()
      case 'preferences':
        return renderPreferencesTab()
      case 'platforms':
        return renderPlatformsTab()
      case 'notifications':
        return renderNotificationsTab()
      case 'billing':
        return renderBillingTab()
      case 'security':
        return renderSecurityTab()
      default:
        return renderProfileTab()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="card">
              <div className="card-body">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(SettingsPage)