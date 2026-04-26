import { permissionService } from '../services/permissionService.js'
import { AuthenticationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * Middleware kiểm tra quyền
 * @param {string} moduleCode - Mã module (vd: 'users', 'patients')
 * @param {string} permissionCode - Mã quyền (vd: 'VIEW', 'CREATE', 'EDIT', 'DELETE')
 */
export const requirePermission = (moduleCode, permissionCode) => {
  return async (req, res, next) => {
    try {
      const username = req.user?.username

      if (!username) {
        logger.warn('Permission check failed - no user in request')
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        })
      }

      const hasPermission = await permissionService.checkPermission(
        username,
        moduleCode,
        permissionCode
      )

      if (!hasPermission) {
        logger.warn('Permission denied', { username, moduleCode, permissionCode })
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền ${permissionCode} trên module ${moduleCode}`,
        })
      }

      logger.debug('Permission granted', { username, moduleCode, permissionCode })
      next()
    } catch (error) {
      logger.error('Error in permission middleware', error)
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền',
      })
    }
  }
}

/**
 * Middleware kiểm tra nhiều quyền (OR logic)
 * User chỉ cần có 1 trong các quyền được liệt kê
 */
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const username = req.user?.username

      if (!username) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        })
      }

      // Kiểm tra từng quyền
      for (const { moduleCode, permissionCode } of permissions) {
        const hasPermission = await permissionService.checkPermission(
          username,
          moduleCode,
          permissionCode
        )

        if (hasPermission) {
          logger.debug('Permission granted (any)', { username, moduleCode, permissionCode })
          return next()
        }
      }

      logger.warn('Permission denied (any)', { username, permissions })
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này',
      })
    } catch (error) {
      logger.error('Error in requireAnyPermission middleware', error)
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền',
      })
    }
  }
}

/**
 * Middleware kiểm tra nhiều quyền (AND logic)
 * User phải có tất cả các quyền được liệt kê
 */
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const username = req.user?.username

      if (!username) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập',
        })
      }

      // Kiểm tra tất cả quyền
      for (const { moduleCode, permissionCode } of permissions) {
        const hasPermission = await permissionService.checkPermission(
          username,
          moduleCode,
          permissionCode
        )

        if (!hasPermission) {
          logger.warn('Permission denied (all)', { username, moduleCode, permissionCode })
          return res.status(403).json({
            success: false,
            message: `Bạn không có quyền ${permissionCode} trên module ${moduleCode}`,
          })
        }
      }

      logger.debug('All permissions granted', { username, permissions })
      next()
    } catch (error) {
      logger.error('Error in requireAllPermissions middleware', error)
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền',
      })
    }
  }
}
