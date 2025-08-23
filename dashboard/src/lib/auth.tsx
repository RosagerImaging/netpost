import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { apiClient } from './api'
import { User } from '@/types'

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    const token = apiClient.getToken()
    if (token) {
      try {
        // Get user info from /me endpoint
        const response = await apiClient.getCurrentUser()
        if (response.success && response.data) {
          setUser(response.data as User)
        } else {
          apiClient.clearToken()
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        apiClient.clearToken()
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      if (response.success && response.data) {
        apiClient.setToken((response.data as any).token)
        setUser((response.data as any).user)
        router.push('/dashboard')
      } else {
        throw new Error(response.error?.message || 'Login failed')
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await apiClient.register(email, password, firstName, lastName)
      if (response.success && response.data) {
        apiClient.setToken((response.data as any).token)
        setUser((response.data as any).user)
        router.push('/dashboard')
      } else {
        throw new Error(response.error?.message || 'Registration failed')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
      setUser(null)
      router.push('/login')
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Utility function to parse JWT
function parseJWT(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

// HOC for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
      }
    }, [user, loading, router])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}