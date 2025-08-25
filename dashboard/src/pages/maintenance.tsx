import { useState, useEffect } from 'react'
import { WrenchScrewdriverIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function MaintenancePage() {
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 2,
    minutes: 30,
    seconds: 0
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        let { hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        }
        
        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-premium-50 via-white to-neutral-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236366F1" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Maintenance Icon */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-premium-100 to-premium-200 rounded-2xl flex items-center justify-center shadow-soft mb-8 transform hover:scale-105 transition-transform duration-300">
          <WrenchScrewdriverIcon className="w-12 h-12 text-premium-600 animate-bounce" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-gradient-premium mb-4">
              Under Maintenance
            </h1>
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              We're Making Things Better
            </h2>
            <p className="text-primary-600/80 text-lg leading-relaxed max-w-lg mx-auto">
              NetPost is currently undergoing scheduled maintenance to improve performance and add exciting new features. 
              We'll be back shortly!
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="card bg-white/80 backdrop-blur-xl border border-white/20 shadow-soft-lg">
            <div className="card-body">
              <div className="flex items-center justify-center mb-4">
                <ClockIcon className="w-6 h-6 text-premium-600 mr-2" />
                <h3 className="text-lg font-semibold text-primary-900">
                  Estimated Time Remaining
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-premium-500 to-premium-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-soft">
                    <span className="text-2xl font-bold text-white">
                      {String(timeRemaining.hours).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary-600">Hours</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-premium-500 to-premium-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-soft">
                    <span className="text-2xl font-bold text-white">
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary-600">Minutes</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-premium-500 to-premium-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-soft">
                    <span className="text-2xl font-bold text-white">
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary-600">Seconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* What We're Working On */}
          <div className="card bg-white/80 backdrop-blur-xl border border-white/20 shadow-soft-lg">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                What We're Working On
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-success-600">✓</span>
                    </div>
                    <p className="text-sm text-primary-600">Database optimization</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-success-600">✓</span>
                    </div>
                    <p className="text-sm text-primary-600">Security enhancements</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-premium-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-premium-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm text-primary-600">New analytics features</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-premium-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-premium-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm text-primary-600">Performance improvements</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-neutral-500">⏳</span>
                    </div>
                    <p className="text-sm text-primary-600">API enhancements</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-neutral-500">⏳</span>
                    </div>
                    <p className="text-sm text-primary-600">Mobile app updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Updated */}
          <div className="card bg-gradient-to-r from-premium-500 to-primary-600 text-white shadow-soft-lg">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-4">
                Stay Updated
              </h3>
              <p className="text-premium-100 mb-6">
                Get notified when we're back online and about future maintenance windows
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl border-0 text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <button className="px-6 py-3 bg-white text-premium-600 rounded-xl font-medium hover:bg-premium-50 transition-colors">
                  Notify Me
                </button>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-8 border-t border-primary-200/50">
            <p className="text-sm text-primary-500 mb-4">
              Follow us for real-time updates
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="https://twitter.com/netpostapp" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-premium-600 transition-colors"
              >
                Twitter
              </a>
              <a 
                href="https://status.netpost.app" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-premium-600 transition-colors"
              >
                Status Page
              </a>
              <a 
                href="mailto:support@netpost.app"
                className="text-primary-600 hover:text-premium-600 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}