import { apiClient } from '@/lib/apiClient'

/**
 * Customer Types
 */
export interface Customer {
  id: string
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  taxCode?: string
  contactPerson?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerCreateRequest {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  taxCode?: string
  contactPerson?: string
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  isActive?: boolean
}

export interface CustomerListParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface CustomerListResponse {
  items: Customer[]
  total: number
  page: number
  limit: number
}

/**
 * Customer Service
 * All customer related API calls
 */
export const customerService = {
  /**
   * Get all customers with pagination
   */
  getAll: async (params?: CustomerListParams): Promise<CustomerListResponse> => {
    const queryString = new URLSearchParams(params as any).toString()
    return apiClient.get<CustomerListResponse>(`/api/customers${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get customer by ID
   */
  getById: async (id: string): Promise<Customer> => {
    return apiClient.get<Customer>(`/api/customers/${id}`)
  },

  /**
   * Create new customer
   */
  create: async (data: CustomerCreateRequest): Promise<Customer> => {
    return apiClient.post<Customer>('/api/customers', data)
  },

  /**
   * Update customer
   */
  update: async (id: string, data: CustomerUpdateRequest): Promise<Customer> => {
    return apiClient.put<Customer>(`/api/customers/${id}`, data)
  },

  /**
   * Delete customer
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/customers/${id}`)
  },

  /**
   * Bulk delete customers
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    return apiClient.post<void>('/api/customers/bulk-delete', { ids })
  },
}
