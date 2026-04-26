import jwt from 'jsonwebtoken'
import { AuthenticationError } from '../utils/errors.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

/**
 * Authentication Middleware
 * Verify JWT token from cookie and attach user to request
 */
export function authMiddleware(req, res, next) {
  // Try to get token from cookie first, then fallback to Authorization header
  let token = req.cookies.accessToken

  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    return next(new AuthenticationError('Không tìm thấy token xác thực'))
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', { error: error.message })
      next(new AuthenticationError('Token không hợp lệ'))
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired')
      next(new AuthenticationError('Token đã hết hạn'))
    } else {
      next(error)
    }
  }
}

/**
 * Optional Authentication Middleware
 * Attach user if token exists, but don't fail if missing
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, env.jwt.secret)
      req.user = decoded
    }

    next()
  } catch (error) {
    // Ignore auth errors for optional auth
    next()
  }
}
