/**
 * Rate Limiting Middleware
 * Protect against brute force attacks
 */

import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

/**
 * Login Rate Limiter
 * Limit login attempts to prevent brute force
 */
export const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    })
    res.status(429).json({
      success: false,
      message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.',
      code: 'RATE_LIMIT_EXCEEDED',
    })
  },
})

/**
 * General API Rate Limiter
 * Limit general API requests
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
