import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.routes.js'
import permissionRoutes from './routes/permission.routes.js'
import adminRolesRoutes from './routes/admin/roles.routes.js'
import updateRoutes from './routes/update.routes.js'
import nhanvienRoutes from './routes/nhanvien.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { sanitizeInput } from './middleware/sanitize.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'
import { gitUpdateChecker } from './services/gitUpdateChecker.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: env.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Cookie parser
app.use(cookieParser(env.cookie.secret))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Sanitize input
app.use(sanitizeInput)

// Compression
app.use(compression())

// Request logging
app.use(requestLogger)

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/admin', adminRolesRoutes)
app.use('/api/update', updateRoutes)
app.use('/api/nhanvien', nhanvienRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(env.port, () => {
  logger.info(`Backend server started`, {
    port: env.port,
    environment: env.nodeEnv,
    url: `http://localhost:${env.port}`,
  })

  // Start auto-update checker
  if (process.env.UPDATE_CHECK_ENABLED === 'true') {
    gitUpdateChecker.startAutoCheck((updateInfo) => {
      if (updateInfo?.hasUpdate) {
        logger.info(`New version available: ${updateInfo.latest}`)
        // Notification will be shown in admin UI
      }
    })
  }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error)
  process.exit(1)
})
