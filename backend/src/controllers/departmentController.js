import { departmentRepository } from '../repositories/departmentRepository.js'
import { errorResponse, successResponse } from '../utils/response.js'
import { logger } from '../utils/logger.js'

const DEFAULT_LIMIT = 1000
const MAX_LIMIT = 5000

function normalizeText(value) {
  return String(value ?? '').trim()
}

function getPagination(query) {
  const requestedLimit = Number(query.limit ?? DEFAULT_LIMIT)
  const requestedOffset = Number(query.offset ?? 0)

  return {
    limit: Math.min(requestedLimit, MAX_LIMIT),
    offset: requestedOffset,
  }
}

function getDepartmentPayload(body) {
  return {
    madv: normalizeText(body.madv),
    tendv: normalizeText(body.tendv),
  }
}

export const departmentController = {
  async getAllDepartments(req, res) {
    try {
      const result = await departmentRepository.getAllDepartments(getPagination(req.query))
      return successResponse(res, result.rows, 'Lấy danh sách khoa phòng thành công')
    } catch (error) {
      logger.error('Error in getAllDepartments', error)
      return errorResponse(res, 'Lỗi lấy danh sách khoa phòng', 500)
    }
  },

  async getDepartmentById(req, res) {
    try {
      const madv = normalizeText(req.params.madv)
      const result = await departmentRepository.getDepartmentById(madv)

      if (result.rows.length === 0) {
        return errorResponse(res, 'Khoa phòng không tồn tại', 404)
      }

      return successResponse(res, result.rows[0], 'Lấy thông tin khoa phòng thành công')
    } catch (error) {
      logger.error('Error in getDepartmentById', error)
      return errorResponse(res, 'Lỗi lấy thông tin khoa phòng', 500)
    }
  },

  async createDepartment(req, res) {
    try {
      const payload = getDepartmentPayload(req.body)
      const existing = await departmentRepository.getDepartmentById(payload.madv)

      if (existing.rows.length > 0) {
        return errorResponse(res, 'Mã đơn vị đã tồn tại', 409)
      }

      const result = await departmentRepository.createDepartment(payload)
      return successResponse(res, result.rows[0], 'Tạo khoa phòng thành công', 201)
    } catch (error) {
      logger.error('Error in createDepartment', error)
      return errorResponse(res, 'Lỗi tạo khoa phòng', 500)
    }
  },

  async updateDepartment(req, res) {
    try {
      const madv = normalizeText(req.params.madv)
      const payload = getDepartmentPayload({ ...req.body, madv })
      const result = await departmentRepository.updateDepartment(madv, payload)

      if (result.rows.length === 0) {
        return errorResponse(res, 'Khoa phòng không tồn tại', 404)
      }

      return successResponse(res, result.rows[0], 'Cập nhật khoa phòng thành công')
    } catch (error) {
      logger.error('Error in updateDepartment', error)
      return errorResponse(res, 'Lỗi cập nhật khoa phòng', 500)
    }
  },

  async deleteDepartment(req, res) {
    try {
      const madv = normalizeText(req.params.madv)
      const result = await departmentRepository.deleteDepartment(madv)

      if (result.rows.length === 0) {
        return errorResponse(res, 'Khoa phòng không tồn tại', 404)
      }

      return successResponse(res, { madv }, 'Xóa khoa phòng thành công')
    } catch (error) {
      logger.error('Error in deleteDepartment', error)
      return errorResponse(res, 'Lỗi xóa khoa phòng', 500)
    }
  },
}
