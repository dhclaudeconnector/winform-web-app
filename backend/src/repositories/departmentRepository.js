import { dbQuery } from '../config/database.js'
import { DatabaseError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const departmentRepository = {
  async getAllDepartments({ limit, offset }) {
    try {
      return await dbQuery(
        `SELECT madv::text AS madv, tendv::text AS tendv
         FROM current.dmdonvi
         ORDER BY madv
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
    } catch (error) {
      logger.error('Database error in getAllDepartments', error)
      throw new DatabaseError('Lỗi truy vấn khoa phòng', error)
    }
  },

  async getDepartmentById(madv) {
    try {
      return await dbQuery(
        `SELECT madv::text AS madv, tendv::text AS tendv
         FROM current.dmdonvi
         WHERE madv = $1`,
        [madv]
      )
    } catch (error) {
      logger.error('Database error in getDepartmentById', error)
      throw new DatabaseError('Lỗi truy vấn khoa phòng', error)
    }
  },

  async createDepartment({ madv, tendv }) {
    try {
      return await dbQuery(
        `INSERT INTO current.dmdonvi (madv, tendv)
         VALUES ($1, $2)
         RETURNING madv::text AS madv, tendv::text AS tendv`,
        [madv, tendv]
      )
    } catch (error) {
      logger.error('Database error in createDepartment', error)
      throw new DatabaseError('Lỗi tạo khoa phòng', error)
    }
  },

  async updateDepartment(madv, { tendv }) {
    try {
      return await dbQuery(
        `UPDATE current.dmdonvi
         SET tendv = $2
         WHERE madv = $1
         RETURNING madv::text AS madv, tendv::text AS tendv`,
        [madv, tendv]
      )
    } catch (error) {
      logger.error('Database error in updateDepartment', error)
      throw new DatabaseError('Lỗi cập nhật khoa phòng', error)
    }
  },

  async deleteDepartment(madv) {
    try {
      return await dbQuery(
        `DELETE FROM current.dmdonvi
         WHERE madv = $1
         RETURNING madv::text AS madv`,
        [madv]
      )
    } catch (error) {
      logger.error('Database error in deleteDepartment', error)
      throw new DatabaseError('Lỗi xóa khoa phòng', error)
    }
  },
}
