import { env, isDevelopment } from './config/env'

/**
 * API Error Class
 * Custom error for API responses with status code and validation errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: any,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * API Response Type
 * Standard response format from backend
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: any
}

/**
 * Request Options
 */
interface RequestOptions extends RequestInit {
  timeout?: number
  skipAuth?: boolean
}

/**
 * Handle API Response
 * Parse and validate response, throw ApiError on failure
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Network error',
      status: response.status
    }))

    throw new ApiError(
      response.status,
      error.message || 'Request failed',
      error.errors,
      error.code
    )
  }

  const data: ApiResponse<T> = await response.json()

  if (!data.success) {
    throw new ApiError(
      response.status,
      data.message || 'Request failed',
      data.errors
    )
  }

  return data.data as T
}

/**
 * Get Authentication Headers
 * Token is now in httpOnly cookie, no need to add manually
 */
function getAuthHeaders(skipAuth = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Token is automatically sent via httpOnly cookie
  // No need to manually add Authorization header

  return headers
}

/**
 * Create Fetch Request with Timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = env.api.timeout, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include', // Important: send cookies with requests
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Log Request (Development Only)
 */
function logRequest(method: string, endpoint: string, data?: unknown) {
  if (isDevelopment()) {
    console.log(`[API ${method}]`, endpoint, data || '')
  }
}

/**
 * API Client
 * Centralized HTTP client for all API calls
 */
export const apiClient = {
  /**
   * GET Request
   */
  get: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    logRequest('GET', endpoint)

    const response = await fetchWithTimeout(`${env.api.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(options.skipAuth),
      ...options,
    })

    return handleResponse<T>(response)
  },

  /**
   * POST Request
   */
  post: async <T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> => {
    logRequest('POST', endpoint, data)

    const response = await fetchWithTimeout(`${env.api.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(options.skipAuth),
      body: JSON.stringify(data),
      ...options,
    })

    return handleResponse<T>(response)
  },

  /**
   * PUT Request
   */
  put: async <T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> => {
    logRequest('PUT', endpoint, data)

    const response = await fetchWithTimeout(`${env.api.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(options.skipAuth),
      body: JSON.stringify(data),
      ...options,
    })

    return handleResponse<T>(response)
  },

  /**
   * PATCH Request
   */
  patch: async <T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> => {
    logRequest('PATCH', endpoint, data)

    const response = await fetchWithTimeout(`${env.api.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(options.skipAuth),
      body: JSON.stringify(data),
      ...options,
    })

    return handleResponse<T>(response)
  },

  /**
   * DELETE Request
   */
  delete: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    logRequest('DELETE', endpoint)

    const response = await fetchWithTimeout(`${env.api.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(options.skipAuth),
      ...options,
    })

    return handleResponse<T>(response)
  },
}
