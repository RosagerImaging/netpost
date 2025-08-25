import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ExclamationTriangleIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  const router = useRouter()

  useEffect(() => {
    // Log 404 for analytics
    if (typeof window !== 'undefined') {
      console.log(`404 Error - Path not found: ${router.asPath}`)
    }
  }, [router.asPath])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23059669" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="max-w-lg w-full text-center relative z-10">
        {/* Error Icon */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-coral-100 to-coral-200 rounded-2xl flex items-center justify-center shadow-soft mb-8 transform hover:scale-105 transition-transform duration-300">
          <ExclamationTriangleIcon className="w-12 h-12 text-coral-600" />
        </div>

        {/* Error Message */}
        <div className="space-y-6">
          <div>
            <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-primary-600/80 text-lg leading-relaxed">
              Oops! The page you're looking for seems to have vanished into the digital void. 
              Don't worry, it happens to the best of us.
            </p>
          </div>

          {/* Helpful Actions */}
          <div className="card bg-white/80 backdrop-blur-xl border border-white/20 shadow-soft-lg">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                What can you do?
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-success-600">1</span>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Check the URL for any typos or spelling errors
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-success-600">2</span>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Go back to the previous page using your browser's back button
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-success-600">3</span>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Return to the dashboard and navigate from there
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="btn-secondary flex items-center justify-center"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
            <Link href="/dashboard" className="btn-primary flex items-center justify-center">
              <HomeIcon className="w-5 h-5 mr-2" />
              Return to Dashboard
            </Link>
          </div>

          {/* Help Section */}
          <div className="pt-8 border-t border-primary-200/50">
            <p className="text-sm text-primary-500 mb-4">
              Still having trouble? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/support" 
                className="text-primary-600 hover:text-success-600 font-medium transition-colors text-sm"
              >
                Contact Support →
              </Link>
              <Link 
                href="/help" 
                className="text-primary-600 hover:text-success-600 font-medium transition-colors text-sm"
              >
                Browse Help Center →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}