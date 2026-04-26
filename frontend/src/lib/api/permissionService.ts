import { apiClient } from '../apiClient'

export const permissionService = {
  /**
   * Lấy tất cả quyền của user hiện tại
   */
  getMyPermissions: () => apiClient.get('/permissions/my-permissions'),

  /**
   * Lấy danh sách module user được truy cập
   */
  getMyModules: () => apiClient.get('/permissions/my-modules'),

  /**
   * Lấy menu thường dùng
   */
  getMyFavorites: () => apiClient.get('/permissions/my-favorites'),

  /**
   * Thêm module vào thường dùng
   */
  addFavorite: (moduleCode: string) =>
    apiClient.post(`/permissions/favorites/${moduleCode}`, {}),

  /**
   * Xóa module khỏi thường dùng
   */
  removeFavorite: (moduleCode: string) =>
    apiClient.delete(`/permissions/favorites/${moduleCode}`),

  /**
   * Kiểm tra quyền cụ thể
   */
  checkPermission: (moduleCode: string, permissionCode: string) =>
    apiClient.post('/permissions/check', { moduleCode, permissionCode }),

  /**
   * Lấy thông tin đầy đủ (permissions + modules + favorites)
   */
  getPermissionDetails: () => apiClient.get('/permissions/details'),
}
