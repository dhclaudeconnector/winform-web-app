import { permissionRepository } from '../repositories/permissionRepository.js'
import { logger } from '../utils/logger.js'

// Cache permissions trong memory để tăng performance
const permissionCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 phút

export const permissionService = {
  /**
   * Lấy tất cả quyền của user (có cache)
   */
  async getUserPermissions(username) {
    const cacheKey = `permissions:${username}`
    const cached = permissionCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Permission cache hit', { username })
      return cached.data
    }

    logger.debug('Permission cache miss', { username })
    const result = await permissionRepository.getUserPermissions(username)

    // Chuyển đổi sang format dễ sử dụng: { 'module.permission': true }
    const permissions = {}
    result.rows.forEach((row) => {
      const key = `${row.module_code}.${row.permission_code}`
      permissions[key] = row.granted
    })

    permissionCache.set(cacheKey, {
      data: permissions,
      timestamp: Date.now(),
    })

    return permissions
  },

  /**
   * Lấy danh sách module user được truy cập
   */
  async getUserModules(username) {
    const result = await permissionRepository.getUserModules(username)
    return result.rows
  },

  /**
   * Lấy menu thường dùng
   */
  async getUserFavorites(username) {
    const result = await permissionRepository.getUserFavorites(username)
    return result.rows
  },

  /**
   * Thêm vào thường dùng
   */
  async addFavorite(username, moduleCode) {
    // Lấy module ID từ code
    const moduleResult = await permissionRepository.getModuleByCode(moduleCode)
    if (moduleResult.rows.length === 0) {
      throw new Error('Module không tồn tại')
    }

    const moduleId = moduleResult.rows[0].id
    const result = await permissionRepository.addUserFavorite(username, moduleId)

    logger.info('Added favorite', { username, moduleCode })
    return result.rows[0]
  },

  /**
   * Xóa khỏi thường dùng
   */
  async removeFavorite(username, moduleCode) {
    // Lấy module ID từ code
    const moduleResult = await permissionRepository.getModuleByCode(moduleCode)
    if (moduleResult.rows.length === 0) {
      throw new Error('Module không tồn tại')
    }

    const moduleId = moduleResult.rows[0].id
    const result = await permissionRepository.removeUserFavorite(username, moduleId)

    logger.info('Removed favorite', { username, moduleCode })
    return result.rows[0]
  },

  /**
   * Kiểm tra quyền cụ thể
   */
  async checkPermission(username, moduleCode, permissionCode) {
    // Thử cache trước
    const permissions = await this.getUserPermissions(username)
    const key = `${moduleCode}.${permissionCode}`

    if (key in permissions) {
      return permissions[key]
    }

    // Fallback: query trực tiếp
    return await permissionRepository.checkPermission(username, moduleCode, permissionCode)
  },

  /**
   * Xóa cache của user
   */
  clearUserCache(username) {
    const cacheKey = `permissions:${username}`
    permissionCache.delete(cacheKey)
    logger.debug('Permission cache cleared', { username })
  },

  /**
   * Xóa toàn bộ cache
   */
  clearAllCache() {
    permissionCache.clear()
    logger.info('All permission cache cleared')
  },

  /**
   * Lấy thông tin đầy đủ về quyền của user (cho admin)
   */
  async getUserPermissionDetails(username) {
    const [permissions, modules, favorites] = await Promise.all([
      this.getUserPermissions(username),
      this.getUserModules(username),
      this.getUserFavorites(username),
    ])

    return {
      permissions,
      modules,
      favorites,
    }
  },
}
