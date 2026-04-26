import { dbQuery } from '../config/database.js'
import { DatabaseError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const roleRepository = {
  /**
   * Lấy tất cả vai trò
   */
  async getAllRoles() {
    try {
      return await dbQuery(
        `SELECT id, code, name, description, is_active, created_at, updated_at
         FROM webauth.roles
         WHERE is_active = true
         ORDER BY name`
      )
    } catch (error) {
      logger.error('Database error in getAllRoles', error)
      throw new DatabaseError('Lỗi truy vấn vai trò', error)
    }
  },

  /**
   * Lấy vai trò theo ID
   */
  async getRoleById(roleId) {
    try {
      return await dbQuery(
        `SELECT id, code, name, description, is_active, created_at, updated_at
         FROM webauth.roles
         WHERE id = $1`,
        [roleId]
      )
    } catch (error) {
      logger.error('Database error in getRoleById', error)
      throw new DatabaseError('Lỗi truy vấn vai trò', error)
    }
  },

  /**
   * Lấy quyền của vai trò
   */
  async getRolePermissions(roleId) {
    try {
      return await dbQuery(
        `SELECT
           p.id as permission_id,
           m.code as module_code,
           m.name as module_name,
           p.code as permission_code,
           p.name as permission_name,
           rp.granted
         FROM webauth.role_permissions rp
         JOIN webauth.permissions p ON rp.permission_id = p.id
         JOIN webauth.modules m ON p.module_id = m.id
         WHERE rp.role_id = $1
         ORDER BY m.sort_order, m.name, p.code`,
        [roleId]
      )
    } catch (error) {
      logger.error('Database error in getRolePermissions', error)
      throw new DatabaseError('Lỗi truy vấn quyền vai trò', error)
    }
  },

  /**
   * Gán vai trò cho user
   */
  async assignRoleToUser(username, roleId, assignedBy) {
    try {
      return await dbQuery(
        `INSERT INTO webauth.user_roles (username, role_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (username, role_id) DO NOTHING
         RETURNING *`,
        [username, roleId, assignedBy]
      )
    } catch (error) {
      logger.error('Database error in assignRoleToUser', error)
      throw new DatabaseError('Lỗi gán vai trò cho người dùng', error)
    }
  },

  /**
   * Xóa vai trò của user
   */
  async removeRoleFromUser(username, roleId) {
    try {
      return await dbQuery(
        `DELETE FROM webauth.user_roles
         WHERE username = $1 AND role_id = $2
         RETURNING *`,
        [username, roleId]
      )
    } catch (error) {
      logger.error('Database error in removeRoleFromUser', error)
      throw new DatabaseError('Lỗi xóa vai trò người dùng', error)
    }
  },

  /**
   * Lấy vai trò của user
   */
  async getUserRoles(username) {
    try {
      return await dbQuery(
        `SELECT r.id, r.code, r.name, r.description, ur.assigned_at, ur.assigned_by
         FROM webauth.user_roles ur
         JOIN webauth.roles r ON ur.role_id = r.id
         WHERE ur.username = $1
           AND r.is_active = true
         ORDER BY r.name`,
        [username]
      )
    } catch (error) {
      logger.error('Database error in getUserRoles', error)
      throw new DatabaseError('Lỗi truy vấn vai trò người dùng', error)
    }
  },

  /**
   * Tạo vai trò mới
   */
  async createRole(code, name, description) {
    try {
      return await dbQuery(
        `INSERT INTO webauth.roles (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [code, name, description]
      )
    } catch (error) {
      logger.error('Database error in createRole', error)
      throw new DatabaseError('Lỗi tạo vai trò', error)
    }
  },

  /**
   * Cập nhật vai trò
   */
  async updateRole(roleId, name, description, isActive) {
    try {
      return await dbQuery(
        `UPDATE webauth.roles
         SET name = $2, description = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [roleId, name, description, isActive]
      )
    } catch (error) {
      logger.error('Database error in updateRole', error)
      throw new DatabaseError('Lỗi cập nhật vai trò', error)
    }
  },

  /**
   * Gán quyền cho vai trò
   */
  async assignPermissionToRole(roleId, permissionId, granted = true) {
    try {
      return await dbQuery(
        `INSERT INTO webauth.role_permissions (role_id, permission_id, granted)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_id, permission_id)
         DO UPDATE SET granted = $3
         RETURNING *`,
        [roleId, permissionId, granted]
      )
    } catch (error) {
      logger.error('Database error in assignPermissionToRole', error)
      throw new DatabaseError('Lỗi gán quyền cho vai trò', error)
    }
  },

  /**
   * Xóa quyền của vai trò
   */
  async removePermissionFromRole(roleId, permissionId) {
    try {
      return await dbQuery(
        `DELETE FROM webauth.role_permissions
         WHERE role_id = $1 AND permission_id = $2
         RETURNING *`,
        [roleId, permissionId]
      )
    } catch (error) {
      logger.error('Database error in removePermissionFromRole', error)
      throw new DatabaseError('Lỗi xóa quyền vai trò', error)
    }
  },
}
