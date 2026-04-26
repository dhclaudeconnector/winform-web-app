import { permissionService } from '../services/permissionService.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { logger } from '../utils/logger.js'

export const permissionController = {
  /**
   * GET /api/permissions/my-permissions
   * Lấy tất cả quyền của user hiện tại
   */
  async getMyPermissions(req, res) {
    try {
      const username = req.user.username
      const permissions = await permissionService.getUserPermissions(username)

      return successResponse(res, permissions, 'Lấy quyền thành công')
    } catch (error) {
      logger.error('Error in getMyPermissions', error)
      return errorResponse(res, 'Lỗi lấy quyền người dùng', 500)
    }
  },

  /**
   * GET /api/permissions/my-modules
   * Lấy danh sách module user được truy cập
   */
  async getMyModules(req, res) {
    try {
      const username = req.user.username
      const modules = await permissionService.getUserModules(username)

      return successResponse(res, modules, 'Lấy danh sách module thành công')
    } catch (error) {
      logger.error('Error in getMyModules', error)
      return errorResponse(res, 'Lỗi lấy danh sách module', 500)
    }
  },

  /**
   * GET /api/permissions/my-favorites
   * Lấy menu thường dùng
   */
  async getMyFavorites(req, res) {
    try {
      const username = req.user.username
      const favorites = await permissionService.getUserFavorites(username)

      return successResponse(res, favorites, 'Lấy menu thường dùng thành công')
    } catch (error) {
      logger.error('Error in getMyFavorites', error)
      return errorResponse(res, 'Lỗi lấy menu thường dùng', 500)
    }
  },

  /**
   * POST /api/permissions/favorites/:moduleCode
   * Thêm module vào thường dùng
   */
  async addFavorite(req, res) {
    try {
      const username = req.user.username
      const { moduleCode } = req.params

      const result = await permissionService.addFavorite(username, moduleCode)

      return successResponse(res, result, 'Thêm vào thường dùng thành công')
    } catch (error) {
      logger.error('Error in addFavorite', error)
      return errorResponse(res, error.message || 'Lỗi thêm menu thường dùng', 500)
    }
  },

  /**
   * DELETE /api/permissions/favorites/:moduleCode
   * Xóa module khỏi thường dùng
   */
  async removeFavorite(req, res) {
    try {
      const username = req.user.username
      const { moduleCode } = req.params

      const result = await permissionService.removeFavorite(username, moduleCode)

      return successResponse(res, result, 'Xóa khỏi thường dùng thành công')
    } catch (error) {
      logger.error('Error in removeFavorite', error)
      return errorResponse(res, error.message || 'Lỗi xóa menu thường dùng', 500)
    }
  },

  /**
   * POST /api/permissions/check
   * Kiểm tra quyền cụ thể
   */
  async checkPermission(req, res) {
    try {
      const username = req.user.username
      const { moduleCode, permissionCode } = req.body

      if (!moduleCode || !permissionCode) {
        return errorResponse(res, 'moduleCode và permissionCode là bắt buộc', 400)
      }

      const hasPermission = await permissionService.checkPermission(
        username,
        moduleCode,
        permissionCode
      )

      return successResponse(
        res,
        { hasPermission, moduleCode, permissionCode },
        'Kiểm tra quyền thành công'
      )
    } catch (error) {
      logger.error('Error in checkPermission', error)
      return errorResponse(res, 'Lỗi kiểm tra quyền', 500)
    }
  },

  /**
   * GET /api/permissions/details
   * Lấy thông tin đầy đủ về quyền (permissions + modules + favorites)
   */
  async getPermissionDetails(req, res) {
    try {
      const username = req.user.username
      const details = await permissionService.getUserPermissionDetails(username)

      return successResponse(res, details, 'Lấy thông tin quyền thành công')
    } catch (error) {
      logger.error('Error in getPermissionDetails', error)
      return errorResponse(res, 'Lỗi lấy thông tin quyền', 500)
    }
  },
}
