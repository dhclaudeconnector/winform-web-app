import { apiClient } from '../apiClient'

export const permissionService = {
  /**
   * Lấy tất cả quyền của user hiện tại
   */
  getMyPermissions: () => apiClient.get('/api/permissions/my-permissions'),

  /**
   * Lấy danh sách module user được truy cập
   */
  getMyModules: () => apiClient.get('/api/permissions/my-modules'),

  /**
   * Lấy menu thường dùng
   */
  getMyFavorites: () => apiClient.get('/api/permissions/my-favorites'),

  /**
   * Thêm module vào thường dùng
   */
  addFavorite: (moduleCode: string) =>
    apiClient.post(`/api/permissions/favorites/${moduleCode}`, {}),

  /**
   * Xóa module khỏi thường dùng
   */
  removeFavorite: (moduleCode: string) =>
    apiClient.delete(`/api/permissions/favorites/${moduleCode}`),

  /**
   * Kiểm tra quyền cụ thể
   */
  checkPermission: (moduleCode: string, permissionCode: string) =>
    apiClient.post('/api/permissions/check', { moduleCode, permissionCode }),

  /**
   * Lấy thông tin đầy đủ (permissions + modules + favorites)
   */
  getPermissionDetails: () => apiClient.get('/api/permissions/details'),
}
