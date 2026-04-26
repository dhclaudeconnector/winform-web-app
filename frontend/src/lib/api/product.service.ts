import { apiClient } from '@/lib/apiClient'

/**
 * Product Types
 */
export interface Product {
  id: string
  code: string
  name: string
  unit: string
  price: number
  stock: number
  categoryId?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductCreateRequest {
  code: string
  name: string
  unit: string
  price: number
  stock?: number
  categoryId?: string
  description?: string
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  isActive?: boolean
}

export interface ProductListParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  isActive?: boolean
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  limit: number
}

/**
 * Product Service
 * All product related API calls
 */
export const productService = {
  /**
   * Get all products with pagination
   */
  getAll: async (params?: ProductListParams): Promise<ProductListResponse> => {
    const queryString = new URLSearchParams(params as any).toString()
    return apiClient.get<ProductListResponse>(`/api/products${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/api/products/${id}`)
  },

  /**
   * Create new product
   */
  create: async (data: ProductCreateRequest): Promise<Product> => {
    return apiClient.post<Product>('/api/products', data)
  },

  /**
   * Update product
   */
  update: async (id: string, data: ProductUpdateRequest): Promise<Product> => {
    return apiClient.put<Product>(`/api/products/${id}`, data)
  },

  /**
   * Delete product
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/products/${id}`)
  },

  /**
   * Bulk delete products
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    return apiClient.post<void>('/api/products/bulk-delete', { ids })
  },
}
