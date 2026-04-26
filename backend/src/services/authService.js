import jwt from 'jsonwebtoken'
import { authRepository } from '../repositories/authRepository.js'
import { permissionService } from './permissionService.js'
import { eventBus } from '../events/eventBus.js'
import { AuthenticationError, ValidationError } from '../utils/errors.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const authService = {
  /**
   * Login user with username and password
   * Validates against current.dmnhanvien table with MD5 password
   */
  async login(username, password, accountingMonth, workDate) {
    if (!username || !password) {
      throw new ValidationError('Tên đăng nhập và mật khẩu là bắt buộc')
    }

    logger.info('Login attempt', { username })

    // Find user in database with MD5 password check
    const result = await authRepository.findByUsername(username, password)

    if (result.rows.length === 0) {
      logger.warn('Login failed - invalid credentials', { username })
      throw new AuthenticationError('Tên đăng nhập hoặc mật khẩu không đúng')
    }

    const user = result.rows[0]

    // Lấy permissions, modules, favorites của user
    const [permissions, modules, favorites] = await Promise.all([
      permissionService.getUserPermissions(user.taikhoan),
      permissionService.getUserModules(user.taikhoan),
      permissionService.getUserFavorites(user.taikhoan),
    ])

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        username: user.taikhoan,
        name: user.hoten,
        accountingMonth: accountingMonth || new Date().toISOString().slice(0, 7),
        workDate: workDate || new Date().toISOString().slice(0, 10),
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    )

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        username: user.taikhoan,
        type: 'refresh',
      },
      env.jwt.secret,
      { expiresIn: env.jwt.refreshExpiresIn }
    )

    // Emit event
    await eventBus.emit('auth.user_logged_in', {
      username: user.taikhoan,
      accountingMonth,
      workDate,
      timestamp: new Date(),
    })

    logger.info('Login successful', { username })

    return {
      accessToken,
      refreshToken,
      user: {
        username: user.taikhoan,
        fullName: user.hoten,
        email: user.email,
        accountingMonth: accountingMonth || new Date().toISOString().slice(0, 7),
        workDate: workDate || new Date().toISOString().slice(0, 10),
      },
      permissions,
      modules,
      favorites,
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token không tồn tại')
    }

    try {
      const decoded = jwt.verify(refreshToken, env.jwt.secret)

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Token không hợp lệ')
      }

      // Get user info
      const result = await authRepository.findByUsernameOnly(decoded.username)

      if (result.rows.length === 0) {
        throw new AuthenticationError('Người dùng không tồn tại')
      }

      const user = result.rows[0]

      // Generate new access token
      const accessToken = jwt.sign(
        {
          username: user.taikhoan,
          name: user.hoten,
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
      )

      logger.info('Token refreshed', { username: decoded.username })

      return {
        accessToken,
        user: {
          username: user.taikhoan,
          fullName: user.hoten,
          email: user.email,
        },
      }
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Refresh token không hợp lệ hoặc đã hết hạn')
      }
      throw error
    }
  },

  /**
   * Get user profile
   */
  async getProfile(username) {
    const result = await authRepository.findByUsernameOnly(username)

    if (result.rows.length === 0) {
      throw new AuthenticationError('Người dùng không tồn tại')
    }

    const user = result.rows[0]

    return {
      username: user.taikhoan,
      fullName: user.hoten,
      email: user.email,
    }
  },
}
