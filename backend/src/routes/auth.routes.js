import express from 'express'
import { body } from 'express-validator'
import { authController } from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username là bắt buộc')
      .isLength({ min: 3, max: 50 }).withMessage('Username phải từ 3-50 ký tự')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username chỉ chứa chữ, số và _'),
    body('password')
      .notEmpty().withMessage('Password là bắt buộc')
      .isLength({ min: 3 }).withMessage('Password phải ít nhất 3 ký tự'),
    body('accountingMonth').optional().isString().trim(),
    body('workDate').optional().isString().trim(),
  ],
  validate,
  authController.login
)

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authMiddleware, authController.logout)

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authController.refreshToken)

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, authController.getProfile)

export default router
