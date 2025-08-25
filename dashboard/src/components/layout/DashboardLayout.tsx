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
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-primary-50/50 via-white to-neutral-50/50">
      {/* Mobile sidebar */}
      <div className={clsx(
        "fixed inset-0 flex z-40 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full glass-sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-4">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-8 pb-4 overflow-y-auto scrollbar-thin">
            {/* Logo section */}
            <div className="flex-shrink-0 flex items-center px-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-premium-600 rounded-xl flex items-center justify-center shadow-soft">
                  <span className="text-lg font-bold text-white">N</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">NetPost</h1>
                  <p className="text-xs text-primary-600/70 font-medium">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="px-4 space-y-2">
              {currentNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "nav-link",
                    item.current ? "nav-link-active" : "nav-link-inactive"
                  )}
                >
                  <item.icon
                    className={clsx(
                      item.current ? 'text-primary-700' : 'text-primary-500 group-hover:text-primary-700',
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                  />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User section */}
          <div className="flex-shrink-0 border-t border-primary-200/20 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-primary-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-primary-600/80 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-0 flex-1 glass-sidebar">
            <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto scrollbar-thin">
              {/* Logo section */}
              <div className="flex items-center flex-shrink-0 px-6 mb-12">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-premium-600 rounded-2xl flex items-center justify-center shadow-soft hover:shadow-glow transition-shadow duration-300">
                    <span className="text-xl font-bold text-white">N</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gradient">NetPost</h1>
                    <p className="text-sm text-primary-600/70 font-medium">Professional Dashboard</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 space-y-2">
                {currentNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "nav-link group",
                      item.current ? "nav-link-active" : "nav-link-inactive"
                    )}
                  >
                    <item.icon
                      className={clsx(
                        item.current ? 'text-primary-700' : 'text-primary-500 group-hover:text-primary-700',
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                      )}
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* User section */}
            <div className="flex-shrink-0 border-t border-primary-200/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
                    <UserCircleIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-primary-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-primary-600/80">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-all"
                  title="Sign out"
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
        {/* Mobile header */}
        <div className="lg:hidden p-4 bg-white/80 backdrop-blur-sm border-b border-white/20">
          <button
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Page header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-6 lg:px-8 shadow-soft">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="heading-primary">
                  {getPageTitle(router.pathname)}
                </h1>
                <p className="text-sm text-muted mt-1">
                  {getPageSubtitle(router.pathname)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User subscription badge */}
              <span className={clsx(
                "badge font-semibold",
                user?.subscriptionTier === 'enterprise' 
                  ? 'badge-premium'
                  : user?.subscriptionTier === 'professional'
                  ? 'badge-primary'
                  : user?.subscriptionTier === 'starter'
                  ? 'badge-success'
                  : 'badge-warning'
              )}>
                {user?.subscriptionTier?.toUpperCase() || 'TRIAL'}
              </span>
              
              {/* Notifications */}
              <button className="relative p-3 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-xl transition-all focus-ring">
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-coral-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">3</span>
                </span>
              </button>
              
              {/* User menu for mobile */}
              <div className="lg:hidden">
                <button
                  onClick={handleLogout}
                  className="p-3 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-xl transition-all"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none scrollbar-thin">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname.startsWith('/dashboard/inventory')) return 'Inventory Management'
  if (pathname.startsWith('/dashboard/cross-listing')) return 'Cross-listing Hub'
  if (pathname.startsWith('/dashboard/analytics')) return 'Analytics Center'
  if (pathname.startsWith('/dashboard/seo')) return 'SEO Analytics'
  if (pathname.startsWith('/dashboard/settings')) return 'Settings'
  return 'Dashboard'
}

function getPageSubtitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Monitor your business performance and manage operations'
  if (pathname.startsWith('/dashboard/inventory')) return 'Manage your product inventory and listings'
  if (pathname.startsWith('/dashboard/cross-listing')) return 'List your products across multiple platforms'
  if (pathname.startsWith('/dashboard/analytics')) return 'Track sales performance and market insights'
  if (pathname.startsWith('/dashboard/seo')) return 'Optimize your listings for better visibility'
  if (pathname.startsWith('/dashboard/settings')) return 'Configure your account and preferences'
  return 'Professional e-commerce management platform'
}