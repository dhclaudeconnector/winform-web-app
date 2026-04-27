import express from 'express'
import { body, param, query } from 'express-validator'
import { departmentController } from '../controllers/departmentController.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()

const departmentIdValidators = [
  param('madv')
    .notEmpty()
    .withMessage('Mã đơn vị là bắt buộc')
    .isLength({ max: 50 })
    .withMessage('Mã đơn vị không được vượt quá 50 ký tự'),
]

const departmentBodyValidators = [
  body('madv')
    .trim()
    .notEmpty()
    .withMessage('Mã đơn vị là bắt buộc')
    .isLength({ max: 50 })
    .withMessage('Mã đơn vị không được vượt quá 50 ký tự'),
  body('tendv')
    .trim()
    .notEmpty()
    .withMessage('Tên đơn vị là bắt buộc')
    .isLength({ max: 255 })
    .withMessage('Tên đơn vị không được vượt quá 255 ký tự'),
]

const listQueryValidators = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage('limit phải là số nguyên từ 1 đến 5000'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset phải là số nguyên không âm'),
]

router.use(authenticate)

router.get(
  '/',
  requirePermission('departments', 'VIEW'),
  listQueryValidators,
  validate,
  departmentController.getAllDepartments
)

router.get(
  '/:madv',
  requirePermission('departments', 'VIEW'),
  departmentIdValidators,
  validate,
  departmentController.getDepartmentById
)

router.post(
  '/',
  requirePermission('departments', 'CREATE'),
  departmentBodyValidators,
  validate,
  departmentController.createDepartment
)

router.put(
  '/:madv',
  requirePermission('departments', 'EDIT'),
  departmentIdValidators,
  body('tendv')
    .trim()
    .notEmpty()
    .withMessage('Tên đơn vị là bắt buộc')
    .isLength({ max: 255 })
    .withMessage('Tên đơn vị không được vượt quá 255 ký tự'),
  validate,
  departmentController.updateDepartment
)

router.delete(
  '/:madv',
  requirePermission('departments', 'DELETE'),
  departmentIdValidators,
  validate,
  departmentController.deleteDepartment
)

export default router
