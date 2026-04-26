import { dbQuery } from '../config/database.js'
import { DatabaseError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const permissionRepository = {
  /**
   * Lấy tất cả quyền của user (từ role + user override)
   */
  async getUserPermissions(username) {
    try {
      return await dbQuery(
        `SELECT module_code, permission_code, granted
         FROM webauth.get_user_permissions($1)
         WHERE granted = true`,
        [username]
      )
    } catch (error) {
      logger.error('Database error in getUserPermissions', error)
      throw new DatabaseError('Lỗi truy vấn quyền người dùng', error)
    }
  },

  /**
   * Lấy danh sách module user được truy cập (có ít nhất 1 quyền VIEW)
   */
  async getUserModules(username) {
    try {
      return await dbQuery(
        `SELECT DISTINCT m.id, m.code, m.name, m.section, m.route, m.icon, m.sort_order
         FROM webauth.modules m
         JOIN webauth.permissions p ON m.id = p.module_id
         WHERE m.is_active = true
           AND EXISTS (
             SELECT 1 FROM webauth.get_user_permissions($1) up
             WHERE up.module_code = m.code
               AND up.permission_code = 'VIEW'
               AND up.granted = true
           )
         ORDER BY m.sort_order, m.name`,
        [username]
      )
    } catch (error) {
      logger.error('Database error in getUserModules', error)
      throw new DatabaseError('Lỗi truy vấn module người dùng', error)
    }
  },

  /**
   * Lấy menu thường dùng của user
   */
  async getUserFavorites(username) {
    try {
      return await dbQuery(
        `SELECT m.id, m.code, m.name, m.section, m.route, m.icon, uf.sort_order
         FROM webauth.user_favorites uf
         JOIN webauth.modules m ON uf.module_id = m.id
         WHERE uf.username = $1
           AND m.is_active = true
         ORDER BY uf.sort_order, m.name`,
        [username]
      )
    } catch (error) {
      logger.error('Database error in getUserFavorites', error)
      throw new DatabaseError('Lỗi truy vấn menu thường dùng', error)
    }
  },

  /**
   * Thêm module vào thường dùng
   */
  async addUserFavorite(username, moduleId) {
    try {
      // Lấy sort_order lớn nhất hiện tại
      const maxOrder = await dbQuery(
        `SELECT COALESCE(MAX(sort_order), 0) as max_order
         FROM webauth.user_favorites
         WHERE username = $1`,
        [username]
      )

      const nextOrder = maxOrder.rows[0].max_order + 1

      return await dbQuery(
        `INSERT INTO webauth.user_favorites (username, module_id, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (username, module_id) DO NOTHING
         RETURNING *`,
        [username, moduleId, nextOrder]
      )
    } catch (error) {
      logger.error('Database error in addUserFavorite', error)
      throw new DatabaseError('Lỗi thêm menu thường dùng', error)
    }
  },

  /**
   * Xóa module khỏi thường dùng
   */
  async removeUserFavorite(username, moduleId) {
    try {
      return await dbQuery(
        `DELETE FROM webauth.user_favorites
         WHERE username = $1 AND module_id = $2
         RETURNING *`,
        [username, moduleId]
      )
    } catch (error) {
      logger.error('Database error in removeUserFavorite', error)
      throw new DatabaseError('Lỗi xóa menu thường dùng', error)
    }
  },

  /**
   * Kiểm tra quyền cụ thể
   */
  async checkPermission(username, moduleCode, permissionCode) {
    try {
      const result = await dbQuery(
        `SELECT webauth.check_permission($1, $2, $3) as has_permission`,
        [username, moduleCode, permissionCode]
      )
      return result.rows[0]?.has_permission || false
    } catch (error) {
      logger.error('Database error in checkPermission', error)
      throw new DatabaseError('Lỗi kiểm tra quyền', error)
    }
  },

  /**
   * Lấy module theo code
   */
  async getModuleByCode(code) {
    try {
      return await dbQuery(
        `SELECT * FROM webauth.modules WHERE code = $1 AND is_active = true`,
        [code]
      )
    } catch (error) {
      logger.error('Database error in getModuleByCode', error)
      throw new DatabaseError('Lỗi truy vấn module', error)
    }
  },
}
