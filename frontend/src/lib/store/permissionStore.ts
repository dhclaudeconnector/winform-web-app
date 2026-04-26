import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { permissionService } from '../api/permissionService'

interface Module {
  id: number
  code: string
  name: string
  section: string
  route: string
  icon?: string
  sort_order: number
}

interface PermissionState {
  permissions: Record<string, boolean> // { 'users.VIEW': true, 'users.CREATE': false, ... }
  modules: Module[]
  favorites: Module[]
  isLoaded: boolean

  // Actions
  loadPermissions: () => Promise<void>
  hasPermission: (moduleCode: string, action: string) => boolean
  addFavorite: (moduleCode: string) => Promise<void>
  removeFavorite: (moduleCode: string) => Promise<void>
  clearPermissions: () => void
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: {},
      modules: [],
      favorites: [],
      isLoaded: false,

  /**
   * Load tất cả permissions, modules, favorites từ API
   */
  loadPermissions: async () => {
    try {
      const response = await permissionService.getPermissionDetails() as any

      console.log('loadPermissions response:', response)

      set({
        permissions: response.permissions,
        modules: response.modules,
        favorites: response.favorites,
        isLoaded: true,
      })
    } catch (error) {
      console.error('Failed to load permissions:', error)
      set({ isLoaded: true }) // Đánh dấu đã load để tránh load lại liên tục
    }
  },

  /**
   * Kiểm tra quyền
   */
  hasPermission: (moduleCode: string, action: string) => {
    const { permissions } = get()
    const key = `${moduleCode}.${action}`
    return permissions[key] === true
  },

  /**
   * Thêm vào thường dùng
   */
  addFavorite: async (moduleCode: string) => {
    try {
      await permissionService.addFavorite(moduleCode)

      // Reload favorites
      const favResponse = await permissionService.getMyFavorites() as any
      set({ favorites: favResponse })
    } catch (error) {
      console.error('Failed to add favorite:', error)
      throw error
    }
  },

  /**
   * Xóa khỏi thường dùng
   */
  removeFavorite: async (moduleCode: string) => {
    try {
      await permissionService.removeFavorite(moduleCode)

      // Reload favorites
      const favResponse = await permissionService.getMyFavorites() as any
      set({ favorites: favResponse })
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      throw error
    }
  },

  /**
   * Xóa tất cả permissions (khi logout)
   */
  clearPermissions: () => {
    set({
      permissions: {},
      modules: [],
      favorites: [],
      isLoaded: false,
    })
  },
    }),
    {
      name: 'permission-storage',
    }
  )
)
