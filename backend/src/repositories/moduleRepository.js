import { dbQuery } from '../config/database.js'
import { DatabaseError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const moduleRepository = {
  /**
   * Lấy tất cả module
   */
  async getAllModules() {
    try {
      return await dbQuery(
        `SELECT id, code, name, description, parent_id, section, icon, route, sort_order, is_active
         FROM webauth.modules
         WHERE is_active = true
         ORDER BY sort_order, name`
      )
    } catch (error) {
      logger.error('Database error in getAllModules', error)
      throw new DatabaseError('Lỗi truy vấn module', error)
    }
  },

  /**
   * Lấy module theo ID
   */
  async getModuleById(moduleId) {
    try {
      return await dbQuery(
        `SELECT id, code, name, description, parent_id, section, icon, route, sort_order, is_active
         FROM webauth.modules
         WHERE id = $1`,
        [moduleId]
      )
    } catch (error) {
      logger.error('Database error in getModuleById', error)
      throw new DatabaseError('Lỗi truy vấn module', error)
    }
  },

  /**
   * Lấy module theo code
   */
  async getModuleByCode(code) {
    try {
      return await dbQuery(
        `SELECT id, code, name, description, parent_id, section, icon, route, sort_order, is_active
         FROM webauth.modules
         WHERE code = $1`,
        [code]
      )
    } catch (error) {
      logger.error('Database error in getModuleByCode', error)
      throw new DatabaseError('Lỗi truy vấn module', error)
    }
  },

  /**
   * Lấy quyền của module
   */
  async getModulePermissions(moduleId) {
    try {
      return await dbQuery(
        `SELECT id, code, name, description
         FROM webauth.permissions
         WHERE module_id = $1
         ORDER BY
           CASE code
             WHEN 'VIEW' THEN 1
             WHEN 'CREATE' THEN 2
             WHEN 'EDIT' THEN 3
             WHEN 'DELETE' THEN 4
             WHEN 'PRINT' THEN 5
             WHEN 'EXPORT' THEN 6
             ELSE 99
           END`,
        [moduleId]
      )
    } catch (error) {
      logger.error('Database error in getModulePermissions', error)
      throw new DatabaseError('Lỗi truy vấn quyền module', error)
    }
  },

  /**
   * Lấy tất cả permissions
   */
  async getAllPermissions() {
    try {
      return await dbQuery(
        `SELECT p.id, p.code, p.name, p.description, p.module_id,
                m.code as module_code, m.name as module_name
         FROM webauth.permissions p
         JOIN webauth.modules m ON p.module_id = m.id
         WHERE m.is_active = true
         ORDER BY m.sort_order, m.name, p.code`
      )
    } catch (error) {
      logger.error('Database error in getAllPermissions', error)
      throw new DatabaseError('Lỗi truy vấn permissions', error)
    }
  },

  /**
   * Tạo module mới
   */
  async createModule(code, name, description, section, icon, route, sortOrder) {
    try {
      return await dbQuery(
        `INSERT INTO webauth.modules (code, name, description, section, icon, route, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [code, name, description, section, icon, route, sortOrder]
      )
    } catch (error) {
      logger.error('Database error in createModule', error)
      throw new DatabaseError('Lỗi tạo module', error)
    }
  },

  /**
   * Cập nhật module
   */
  async updateModule(moduleId, name, description, section, icon, route, sortOrder, isActive) {
    try {
      return await dbQuery(
        `UPDATE webauth.modules
         SET name = $2, description = $3, section = $4, icon = $5,
             route = $6, sort_order = $7, is_active = $8
         WHERE id = $1
         RETURNING *`,
        [moduleId, name, description, section, icon, route, sortOrder, isActive]
      )
    } catch (error) {
      logger.error('Database error in updateModule', error)
      throw new DatabaseError('Lỗi cập nhật module', error)
    }
  },

  /**
   * Lấy danh sách sections
   */
  async getSections() {
    try {
      return await dbQuery(
        `SELECT DISTINCT section
         FROM webauth.modules
         WHERE is_active = true AND section IS NOT NULL
         ORDER BY section`
      )
    } catch (error) {
      logger.error('Database error in getSections', error)
      throw new DatabaseError('Lỗi truy vấn sections', error)
    }
  },
}
