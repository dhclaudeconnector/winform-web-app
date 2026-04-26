import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { sanitizeInput } from './middleware/sanitize.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

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
