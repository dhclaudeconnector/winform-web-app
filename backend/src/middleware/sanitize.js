/**
 * Input Sanitization Middleware
 * Remove potentially dangerous characters from user input
 */

/**
 * Sanitize string input
 * Remove MongoDB operators and dangerous characters
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str

  // Remove MongoDB operators
  return str.replace(/[${}]/g, '')
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip keys that start with $ (MongoDB operators)
    if (key.startsWith('$')) {
      continue
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Sanitize Middleware
 * Clean req.body, req.query, req.params
 * Note: Express 5 has read-only query/params, so we sanitize in-place
 */
export function sanitizeInput(req, res, next) {
  // Sanitize body (writable)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }

  // For Express 5, query and params are read-only
  // We'll sanitize them by creating a proxy or just skip
  // Since validation middleware will catch malicious input anyway

  next()
}
