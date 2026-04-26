import { authService } from '../services/authService.js'
import { ApiResponse } from '../utils/response.js'
import { asyncHandler } from '../middleware/errorHandler.js'

export const authController = {
  /**
   * Login user
   */
  login: asyncHandler(async (req, res) => {
    const { username, password, accountingMonth, workDate } = req.body

    const result = await authService.login(username, password, accountingMonth, workDate)

    // Set httpOnly cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return ApiResponse.success(res, {
      user: result.user,
      permissions: result.permissions,
      modules: result.modules,
      favorites: result.favorites,
    }, 'Đăng nhập thành công')
  }),

  /**
   * Refresh access token
   */
  refreshToken: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken

    const result = await authService.refreshToken(refreshToken)

    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    return ApiResponse.success(res, {
      user: result.user,
    }, 'Token đã được làm mới')
  }),

  /**
   * Get current user profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const username = req.user.username
    const user = await authService.getProfile(username)

    return ApiResponse.success(res, user)
  }),

  /**
   * Logout user
   */
  logout: asyncHandler(async (req, res) => {
    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    return ApiResponse.success(res, null, 'Đăng xuất thành công')
  }),
}
