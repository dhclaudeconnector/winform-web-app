import { roleRepository } from '../../repositories/roleRepository.js'
import { moduleRepository } from '../../repositories/moduleRepository.js'
import { permissionService } from '../../services/permissionService.js'
import { dbQuery } from '../../config/database.js'
import { successResponse, errorResponse } from '../../utils/response.js'
import { logger } from '../../utils/logger.js'

export const roleController = {
  /**
   * GET /api/admin/roles
   */
  async getAllRoles(req, res) {
    try {
      const result = await roleRepository.getAllRoles()
      return successResponse(res, result.rows, 'Lấy danh sách vai trò thành công')
    } catch (error) {
      logger.error('Error in getAllRoles', error)
      return errorResponse(res, 'Lỗi lấy danh sách vai trò', 500)
    }
  },

  /**
   * GET /api/admin/roles/:id
   */
  async getRoleById(req, res) {
    try {
      const { id } = req.params
      const result = await roleRepository.getRoleById(id)

      if (result.rows.length === 0) {
        return errorResponse(res, 'Vai trò không tồn tại', 404)
      }

      return successResponse(res, result.rows[0], 'Lấy thông tin vai trò thành công')
    } catch (error) {
      logger.error('Error in getRoleById', error)
      return errorResponse(res, 'Lỗi lấy thông tin vai trò', 500)
    }
  },

  /**
   * POST /api/admin/roles
   */
  async createRole(req, res) {
    try {
      const { code, name, description } = req.body

      if (!code || !name) {
        return errorResponse(res, 'code và name là bắt buộc', 400)
      }

      const result = await roleRepository.createRole(code, name, description)
      return successResponse(res, result.rows[0], 'Tạo vai trò thành công', 201)
    } catch (error) {
      logger.error('Error in createRole', error)
      return errorResponse(res, 'Lỗi tạo vai trò', 500)
    }
  },

  /**
   * PUT /api/admin/roles/:id
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params
      const { name, description, isActive } = req.body

      const result = await roleRepository.updateRole(id, name, description, isActive)

      if (result.rows.length === 0) {
        return errorResponse(res, 'Vai trò không tồn tại', 404)
      }

      return successResponse(res, result.rows[0], 'Cập nhật vai trò thành công')
    } catch (error) {
      logger.error('Error in updateRole', error)
      return errorResponse(res, 'Lỗi cập nhật vai trò', 500)
    }
  },

  /**
   * GET /api/admin/roles/:id/permissions
   */
  async getRolePermissions(req, res) {
    try {
      const { id } = req.params
      const result = await roleRepository.getRolePermissions(id)

      return successResponse(res, result.rows, 'Lấy quyền vai trò thành công')
    } catch (error) {
      logger.error('Error in getRolePermissions', error)
      return errorResponse(res, 'Lỗi lấy quyền vai trò', 500)
    }
  },

  /**
   * POST /api/admin/roles/:id/permissions
   */
  async assignPermissionToRole(req, res) {
    try {
      const { id } = req.params
      const { permissions } = req.body

      // Hỗ trợ cả single permission và bulk permissions
      if (permissions && Array.isArray(permissions)) {
        // Bulk update
        for (const perm of permissions) {
          await roleRepository.assignPermissionToRole(id, perm.permission_id, perm.granted)
        }

        // Clear cache cho tất cả users có role này
        permissionService.clearAllCache()

        return successResponse(res, { updated: permissions.length }, 'Cập nhật quyền vai trò thành công')
      } else {
        // Single permission (backward compatibility)
        const { permissionId, granted } = req.body

        if (!permissionId) {
          return errorResponse(res, 'permissionId là bắt buộc', 400)
        }

        const result = await roleRepository.assignPermissionToRole(id, permissionId, granted)

        // Clear cache
        permissionService.clearAllCache()

        return successResponse(res, result.rows[0], 'Gán quyền cho vai trò thành công')
      }
    } catch (error) {
      logger.error('Error in assignPermissionToRole', error)
      return errorResponse(res, 'Lỗi gán quyền cho vai trò', 500)
    }
  },

  /**
   * DELETE /api/admin/roles/:id/permissions/:permissionId
   */
  async removePermissionFromRole(req, res) {
    try {
      const { id, permissionId } = req.params
      const result = await roleRepository.removePermissionFromRole(id, permissionId)

      return successResponse(res, result.rows[0], 'Xóa quyền vai trò thành công')
    } catch (error) {
      logger.error('Error in removePermissionFromRole', error)
      return errorResponse(res, 'Lỗi xóa quyền vai trò', 500)
    }
  },

  /**
   * GET /api/admin/users/:username/roles
   */
  async getUserRoles(req, res) {
    try {
      const { username } = req.params
      const result = await roleRepository.getUserRoles(username)

      return successResponse(res, result.rows, 'Lấy vai trò người dùng thành công')
    } catch (error) {
      logger.error('Error in getUserRoles', error)
      return errorResponse(res, 'Lỗi lấy vai trò người dùng', 500)
    }
  },

  /**
   * POST /api/admin/users/:username/roles
   */
  async assignRoleToUser(req, res) {
    try {
      const { username } = req.params
      const { roleId } = req.body
      const assignedBy = req.user.username

      if (!roleId) {
        return errorResponse(res, 'roleId là bắt buộc', 400)
      }

      const result = await roleRepository.assignRoleToUser(username, roleId, assignedBy)

      // Clear cache
      permissionService.clearUserCache(username)

      return successResponse(res, result.rows[0], 'Gán vai trò cho người dùng thành công')
    } catch (error) {
      logger.error('Error in assignRoleToUser', error)
      return errorResponse(res, 'Lỗi gán vai trò cho người dùng', 500)
    }
  },

  /**
   * DELETE /api/admin/users/:username/roles/:roleId
   */
  async removeRoleFromUser(req, res) {
    try {
      const { username, roleId } = req.params
      const result = await roleRepository.removeRoleFromUser(username, roleId)

      // Clear cache
      permissionService.clearUserCache(username)

      return successResponse(res, result.rows[0], 'Xóa vai trò người dùng thành công')
    } catch (error) {
      logger.error('Error in removeRoleFromUser', error)
      return errorResponse(res, 'Lỗi xóa vai trò người dùng', 500)
    }
  },

  /**
   * GET /api/admin/users/:username/permissions
   */
  async getUserPermissions(req, res) {
    try {
      const { username } = req.params
      const result = await dbQuery(
        `SELECT up.id, p.code as permission_code, p.name as permission_name,
                m.code as module_code, m.name as module_name,
                up.granted, up.note, up.created_at
         FROM webauth.user_permissions up
         JOIN webauth.permissions p ON up.permission_id = p.id
         JOIN webauth.modules m ON p.module_id = m.id
         WHERE up.username = $1
         ORDER BY m.sort_order, m.name, p.code`,
        [username]
      )

      return successResponse(res, result.rows, 'Lấy quyền riêng người dùng thành công')
    } catch (error) {
      logger.error('Error in getUserPermissions', error)
      return errorResponse(res, 'Lỗi lấy quyền người dùng', 500)
    }
  },

  /**
   * POST /api/admin/users/:username/permissions
   */
  async assignPermissionToUser(req, res) {
    try {
      const { username } = req.params
      const { permissionId, granted, note } = req.body

      if (!permissionId) {
        return errorResponse(res, 'permissionId là bắt buộc', 400)
      }

      const result = await dbQuery(
        `INSERT INTO webauth.user_permissions (username, permission_id, granted, note)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username, permission_id)
         DO UPDATE SET granted = $3, note = $4
         RETURNING *`,
        [username, permissionId, granted ?? true, note]
      )

      // Clear cache
      permissionService.clearUserCache(username)

      return successResponse(res, result.rows[0], 'Gán quyền riêng cho người dùng thành công')
    } catch (error) {
      logger.error('Error in assignPermissionToUser', error)
      return errorResponse(res, 'Lỗi gán quyền cho người dùng', 500)
    }
  },

  /**
   * DELETE /api/admin/users/:username/permissions/:permissionId
   */
  async removePermissionFromUser(req, res) {
    try {
      const { username, permissionId } = req.params
      const result = await dbQuery(
        `DELETE FROM webauth.user_permissions
         WHERE username = $1 AND permission_id = $2
         RETURNING *`,
        [username, permissionId]
      )

      // Clear cache
      permissionService.clearUserCache(username)

      return successResponse(res, result.rows[0], 'Xóa quyền riêng người dùng thành công')
    } catch (error) {
      logger.error('Error in removePermissionFromUser', error)
      return errorResponse(res, 'Lỗi xóa quyền người dùng', 500)
    }
  },

  /**
   * GET /api/admin/modules
   */
  async getAllModules(req, res) {
    try {
      const result = await moduleRepository.getAllModules()
      return successResponse(res, result.rows, 'Lấy danh sách module thành công')
    } catch (error) {
      logger.error('Error in getAllModules', error)
      return errorResponse(res, 'Lỗi lấy danh sách module', 500)
    }
  },

  /**
   * GET /api/admin/permissions
   */
  async getAllPermissions(req, res) {
    try {
      const result = await moduleRepository.getAllPermissions()
      return successResponse(res, result.rows, 'Lấy danh sách permissions thành công')
    } catch (error) {
      logger.error('Error in getAllPermissions', error)
      return errorResponse(res, 'Lỗi lấy danh sách permissions', 500)
    }
  },

  /**
   * GET /api/admin/users
   */
  async getAllUsers(req, res) {
    try {
      const result = await dbQuery(
        `SELECT
          taikhoan as username,
          CONCAT(holot, ' ', ten) as "fullName",
          email
         FROM current.dmnhanvien
         ORDER BY taikhoan`
      )
      return successResponse(res, result.rows, 'Lấy danh sách người dùng thành công')
    } catch (error) {
      logger.error('Error in getAllUsers', error)
      return errorResponse(res, 'Lỗi lấy danh sách người dùng', 500)
    }
  },
}
