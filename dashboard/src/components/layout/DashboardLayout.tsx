import React, { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/auth'
import {
  HomeIcon,
  CubeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface DashboardLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
  { name: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon, current: false },
  { name: 'Cross-listing', href: '/dashboard/cross-listing', icon: ArrowPathIcon, current: false },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon, current: false },
  { name: 'SEO Analysis', href: '/dashboard/seo', icon: MagnifyingGlassIcon, current: false },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, current: false },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  // Update current navigation item based on route
  const currentNavigation = navigation.map(item => ({
    ...item,
    current: router.pathname === item.href || router.pathname.startsWith(item.href + '/')
  }))

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={clsx(
        "fixed inset-0 flex z-40 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-2xl font-bold text-primary-600">NetPost</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {currentNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    item.current
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={clsx(
                      item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-4 flex-shrink-0 h-6 w-6'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm font-medium text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-2xl font-bold text-primary-600">NetPost</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {currentNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      item.current
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-6 w-6'
                      )}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div>
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs font-medium text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 p-1 text-gray-400 hover:text-gray-500"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Page header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {getPageTitle(router.pathname)}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User subscription badge */}
              <span className={clsx(
                "px-2 py-1 text-xs font-medium rounded-full",
                user?.subscriptionTier === 'enterprise' 
                  ? 'bg-purple-100 text-purple-800'
                  : user?.subscriptionTier === 'professional'
                  ? 'bg-blue-100 text-blue-800'
                  : user?.subscriptionTier === 'starter'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              )}>
                {user?.subscriptionTier?.toUpperCase() || 'TRIAL'}
              </span>
              
              {/* Notifications */}
              <button className="p-1 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
              </button>
              
              {/* User menu for mobile */}
              <div className="lg:hidden">
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname.startsWith('/dashboard/inventory')) return 'Inventory'
  if (pathname.startsWith('/dashboard/cross-listing')) return 'Cross-listing'
  if (pathname.startsWith('/dashboard/analytics')) return 'Analytics'
  if (pathname.startsWith('/dashboard/seo')) return 'SEO Analysis'
  if (pathname.startsWith('/dashboard/settings')) return 'Settings'
  return 'Dashboard'
}