import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { register } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName || undefined,
        formData.lastName || undefined
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50/30 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23059669" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="max-w-lg w-full space-y-8 relative z-10">
        {/* Logo and header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-success-600 to-primary-600 rounded-2xl flex items-center justify-center shadow-soft mb-6 transform hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">NetPost</h1>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Join thousands of sellers
          </h2>
          <p className="text-primary-600/80">
            Create your account and start growing your business
          </p>
        </div>
        
        {/* Main card */}
        <div className="card bg-white/80 backdrop-blur-xl border border-white/20 shadow-soft-lg">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="First name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                {/* Email field */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field-large"
                    placeholder="Enter your email address"
                  />
                </div>
                
                {/* Password field */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input-field-large pr-12"
                      placeholder="Create a strong password (min 6 characters)"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary-400 hover:text-primary-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Confirm password field */}
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input-field-large pr-12"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary-400 hover:text-primary-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-coral-50 border border-coral-200 rounded-xl p-4 animate-fade-in">
                  <div className="text-sm text-coral-700 font-medium">{error}</div>
                </div>
              )}

              {/* Create account button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-success text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner-modern h-5 w-5 mr-3"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create your account'
                  )}
                </button>
              </div>

              {/* Terms and privacy */}
              <div className="text-center">
                <p className="text-xs text-primary-500 leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-primary-600/80">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-semibold text-primary-700 hover:text-success-600 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Value proposition */}
        <div className="text-center space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary-800">Free to Start</h4>
                <p className="text-xs text-primary-600">No setup fees</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary-800">Lightning Fast</h4>
                <p className="text-xs text-primary-600">Instant setup</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-premium-100 to-premium-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-premium-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary-800">Enterprise Security</h4>
                <p className="text-xs text-primary-600">Bank-grade encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}