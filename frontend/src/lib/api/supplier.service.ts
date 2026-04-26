import { apiClient } from '@/lib/apiClient'

/**
 * Supplier Types
 */
export interface Supplier {
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

export interface SupplierCreateRequest {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  taxCode?: string
  contactPerson?: string
}

export interface SupplierUpdateRequest extends Partial<SupplierCreateRequest> {
  isActive?: boolean
}

export interface SupplierListParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface SupplierListResponse {
  items: Supplier[]
  total: number
  page: number
  limit: number
}

/**
 * Supplier Service
 */
export const supplierService = {
  getAll: async (params?: SupplierListParams): Promise<SupplierListResponse> => {
    const queryString = new URLSearchParams(params as any).toString()
    return apiClient.get<SupplierListResponse>(`/api/suppliers${queryString ? `?${queryString}` : ''}`)
  },

  getById: async (id: string): Promise<Supplier> => {
    return apiClient.get<Supplier>(`/api/suppliers/${id}`)
  },

  create: async (data: SupplierCreateRequest): Promise<Supplier> => {
    return apiClient.post<Supplier>('/api/suppliers', data)
  },

  update: async (id: string, data: SupplierUpdateRequest): Promise<Supplier> => {
    return apiClient.put<Supplier>(`/api/suppliers/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/suppliers/${id}`)
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    return apiClient.post<void>('/api/suppliers/bulk-delete', { ids })
  },
}
