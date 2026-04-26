import { apiClient } from '@/lib/apiClient'

/**
 * Order Types
 */
export interface OrderItem {
  productId: string
  productCode: string
  productName: string
  quantity: number
  price: number
  amount: number
}

export interface Order {
  id: string
  orderNo: string
  orderDate: string
  customerId: string
  customerName: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderCreateRequest {
  orderDate: string
  customerId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  notes?: string
}

export interface OrderUpdateRequest extends Partial<OrderCreateRequest> {
  status?: Order['status']
}

export interface OrderListParams {
  page?: number
  limit?: number
  search?: string
  customerId?: string
  status?: Order['status']
  fromDate?: string
  toDate?: string
}

export interface OrderListResponse {
  items: Order[]
  total: number
  page: number
  limit: number
}

/**
 * Order Service
 */
export const orderService = {
  getAll: async (params?: OrderListParams): Promise<OrderListResponse> => {
    const queryString = new URLSearchParams(params as any).toString()
    return apiClient.get<OrderListResponse>(`/api/orders${queryString ? `?${queryString}` : ''}`)
  },

  getById: async (id: string): Promise<Order> => {
    return apiClient.get<Order>(`/api/orders/${id}`)
  },

  create: async (data: OrderCreateRequest): Promise<Order> => {
    return apiClient.post<Order>('/api/orders', data)
  },

  update: async (id: string, data: OrderUpdateRequest): Promise<Order> => {
    return apiClient.put<Order>(`/api/orders/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/orders/${id}`)
  },

  updateStatus: async (id: string, status: Order['status']): Promise<Order> => {
    return apiClient.patch<Order>(`/api/orders/${id}/status`, { status })
  },
}
