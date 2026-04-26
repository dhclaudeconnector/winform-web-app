import { apiClient } from '@/lib/apiClient'

/**
 * Auth API Types
 */
export interface LoginRequest {
  username: string
  password: string
  accountingMonth: string
  workDate: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    fullName: string
    role: string
  }
}

export interface User {
  id: string
  username: string
  fullName: string
  email?: string
  role: string
  isActive: boolean
}

/**
 * Auth Service
 * All authentication related API calls
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', credentials, { skipAuth: true })
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    return apiClient.post<void>('/auth/logout', {})
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>('/auth/profile')
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<{ user: User }> => {
    return apiClient.post<{ user: User }>('/auth/refresh', {})
  },

  /**
   * Change password
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    return apiClient.post<void>('/auth/change-password', { oldPassword, newPassword })
  },
}
