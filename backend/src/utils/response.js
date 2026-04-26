/**
 * Response Utility
 * Standardized API response format
 */

export class ApiResponse {
  /**
   * Success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    })
  }

  /**
   * Created response
   */
  static created(res, data = null, message = 'Created successfully') {
    return this.success(res, data, message, 201)
  }

  /**
   * No content response
   */
  static noContent(res) {
    return res.status(204).send()
  }

  /**
   * Paginated response
   */
  static paginated(res, items, total, page, limit) {
    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  }
}

/**
 * Helper functions for backward compatibility
 */
export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return ApiResponse.success(res, data, message, statusCode)
}

export const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  })
}
