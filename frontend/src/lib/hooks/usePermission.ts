import { usePermissionStore } from '../store/permissionStore'

/**
 * Hook để kiểm tra quyền
 * @param moduleCode - Mã module (vd: 'users', 'patients')
 * @param action - Hành động (vd: 'VIEW', 'CREATE', 'EDIT', 'DELETE')
 */
export function usePermission(moduleCode: string, action: string) {
  const hasPermission = usePermissionStore((state) =>
    state.hasPermission(moduleCode, action)
  )

  return { hasPermission }
}

/**
 * Hook để lấy tất cả modules user có quyền truy cập
 */
export function useUserModules() {
  const modules = usePermissionStore((state) => state.modules)
  const isLoaded = usePermissionStore((state) => state.isLoaded)

  return { modules, isLoaded }
}

/**
 * Hook để lấy menu thường dùng
 */
export function useFavorites() {
  const favorites = usePermissionStore((state) => state.favorites)
  const addFavorite = usePermissionStore((state) => state.addFavorite)
  const removeFavorite = usePermissionStore((state) => state.removeFavorite)

  return { favorites, addFavorite, removeFavorite }
}

/**
 * Hook để load permissions khi app khởi động
 */
export function useLoadPermissions() {
  const loadPermissions = usePermissionStore((state) => state.loadPermissions)
  const isLoaded = usePermissionStore((state) => state.isLoaded)

  return { loadPermissions, isLoaded }
}
