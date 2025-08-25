import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { XCircleIcon, HomeIcon, ArrowPathIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function ServerErrorPage() {
  const router = useRouter()

  useEffect(() => {
    // Log server error for monitoring
    if (typeof window !== 'undefined') {
      console.error(`500 Server Error - Path: ${router.asPath}`)
      // You could send this to your error tracking service
    }
  }, [router.asPath])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-white to-neutral-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23EF4444" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="max-w-lg w-full text-center relative z-10">
        {/* Error Icon */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center shadow-soft mb-8 transform hover:scale-105 transition-transform duration-300">
          <XCircleIcon className="w-12 h-12 text-coral-600" />
        </div>

        {/* Error Message */}
        <div className="space-y-6">
          <div>
            <h1 className="text-8xl font-bold text-gradient-coral mb-4">500</h1>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Server Error
            </h2>
            <p className="text-primary-600/80 text-lg leading-relaxed">
              Something went wrong on our end. Our team has been notified and is working to fix this issue. 
              Please try again in a few moments.
            </p>
          </div>

          {/* Error Details Card */}
          <div className="card bg-white/80 backdrop-blur-xl border border-white/20 shadow-soft-lg">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                What happened?
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-coral-400 rounded-full mt-2"></div>
                  <p className="text-primary-600 text-sm">
                    Our servers encountered an unexpected error
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-coral-400 rounded-full mt-2"></div>
                  <p className="text-primary-600 text-sm">
                    This issue has been automatically reported to our team
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-coral-400 rounded-full mt-2"></div>
                  <p className="text-primary-600 text-sm">
                    We're working to resolve this as quickly as possible
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRefresh}
              className="btn-secondary flex items-center justify-center"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Try Again
            </button>
            <Link href="/dashboard" className="btn-primary flex items-center justify-center">
              <HomeIcon className="w-5 h-5 mr-2" />
              Return to Dashboard
            </Link>
          </div>

          {/* Status Information */}
          <div className="card bg-neutral-50/80 backdrop-blur-xl border border-neutral-200/50 shadow-soft">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-primary-900">
                    System Status
                  </h4>
                  <p className="text-xs text-primary-600 mt-1">
                    Check our status page for real-time updates
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-700">
                    Investigating
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="pt-8 border-t border-primary-200/50">
            <p className="text-sm text-primary-500 mb-4">
              Need immediate assistance?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="mailto:support@netpost.app" 
                className="text-primary-600 hover:text-success-600 font-medium transition-colors text-sm flex items-center justify-center"
              >
                <EnvelopeIcon className="w-4 h-4 mr-1" />
                Email Support →
              </Link>
              <Link 
                href="https://status.netpost.app" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-success-600 font-medium transition-colors text-sm"
              >
                Status Page →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}