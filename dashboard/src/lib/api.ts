import axios, { AxiosInstance, AxiosError } from 'axios'

// Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken()
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Token management
  setToken(token: string): void {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('netpost_token', token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('netpost_token')
    }
    return this.token
  }

  clearToken(): void {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('netpost_token')
    }
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.error?.message) {
      return new Error(error.response.data.error.message)
    }
    if (error.message) {
      return new Error(error.message)
    }
    return new Error('An unexpected error occurred')
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password })
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.post('/auth/register', { email, password, firstName, lastName })
  }

  async logout() {
    this.clearToken()
    return { success: true }
  }

  async getCurrentUser() {
    return this.get('/auth/me')
  }

  async refreshToken() {
    return this.post('/auth/refresh')
  }

  // Inventory endpoints
  async getInventory(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    return this.get<PaginatedResponse<any>>('/inventory/list', params)
  }

  async createInventoryItem(data: any) {
    return this.post('/inventory/create', data)
  }

  async updateInventoryItem(id: string, data: any) {
    return this.put(`/inventory/${id}`, data)
  }

  async deleteInventoryItem(id: string) {
    return this.delete(`/inventory/${id}`)
  }

  // Cross-listing endpoints
  async createCrossListing(data: {
    sourcePlatform: string
    targetPlatforms: string[]
    inventoryItems: string[]
    optimizeSEO?: boolean
    generateDescriptions?: boolean
  }) {
    return this.post('/crosslisting/create', data)
  }

  async getCrossListingStatus(requestId: string) {
    return this.get(`/crosslisting/${requestId}`)
  }

  // SEO endpoints
  async analyzeSEO(inventoryItemId: string, platform: string) {
    return this.post('/seo/analyze', { inventoryItemId, platform })
  }

  // Analytics endpoints
  async getAnalytics(params?: {
    startDate?: string
    endDate?: string
    platform?: string
    category?: string
  }) {
    return this.get('/analytics/overview', params)
  }

  async getSalesData(params?: {
    startDate?: string
    endDate?: string
    granularity?: 'day' | 'week' | 'month'
  }) {
    return this.get('/analytics/sales', params)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()