import express from 'express'
import { updateService } from '../services/updateService.js'
import { migrationService } from '../services/migrationService.js'
import { versionService } from '../services/versionService.js'
import { gitUpdateChecker } from '../services/gitUpdateChecker.js'
import { deploymentDetector } from '../services/deploymentDetector.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = express.Router()

// All update routes require admin authentication
router.use(authenticate)
router.use(requirePermission('SYSTEM', 'MANAGE'))

/**
 * GET /api/update/check
 * Check for new version from Git
 */
router.get('/check', async (req, res) => {
  try {
    const updateInfo = await updateService.checkForUpdates()

    if (!updateInfo) {
      return successResponse(res, {
        hasUpdate: false,
        message: 'Unable to check for updates'
      })
    }

    return successResponse(res, updateInfo)
  } catch (error) {
    return errorResponse(res, 'Failed to check for updates', 500, error)
  }
})

/**
 * GET /api/update/status
 * Get current update status and progress
 */
router.get('/status', async (req, res) => {
  try {
    const status = updateService.getStatus()
    const currentVersion = await versionService.getCurrentVersion()
    const deploymentInfo = await deploymentDetector.getInfo()
    const lastCheckTime = gitUpdateChecker.getLastCheckTime()

    return successResponse(res, {
      currentVersion,
      deploymentInfo,
      updateStatus: status,
      lastCheckTime
    })
  } catch (error) {
    return errorResponse(res, 'Failed to get update status', 500, error)
  }
})

/**
 * GET /api/update/migrations/pending
 * Get pending migrations
 */
router.get('/migrations/pending', async (req, res) => {
  try {
    const status = await migrationService.getStatus()

    return successResponse(res, {
      pendingAuto: status.migrations.pendingAuto,
      pendingManual: status.migrations.pendingManual,
      summary: {
        totalPending: status.pending,
        autoCount: status.pendingAuto,
        manualCount: status.pendingManual
      }
    })
  } catch (error) {
    return errorResponse(res, 'Failed to get pending migrations', 500, error)
  }
})

/**
 * POST /api/update/migrations/:version/approve
 * Approve and run a manual migration
 */
router.post('/migrations/:version/approve', async (req, res) => {
  try {
    const { version } = req.params
    const approvedBy = req.user.username

    const result = await migrationService.runManualMigration(version, approvedBy)

    return successResponse(res, {
      message: 'Migration executed successfully',
      version,
      approvedBy,
      executionTime: result.executionTime
    })
  } catch (error) {
    return errorResponse(res, 'Failed to execute migration', 500, error)
  }
})

/**
 * GET /api/update/migrations/:version/preview
 * Preview migration SQL
 */
router.get('/migrations/:version/preview', async (req, res) => {
  try {
    const { version } = req.params
    const pending = await migrationService.getPendingMigrations()
    const migration = pending.find(m => m.version === version)

    if (!migration) {
      return errorResponse(res, 'Migration not found', 404)
    }

    const sql = await migrationService.readMigrationSQL(migration.filepath)

    return successResponse(res, {
      migration: {
        version: migration.version,
        type: migration.type,
        risk: migration.risk,
        description: migration.description,
        filename: migration.filename
      },
      sql
    })
  } catch (error) {
    return errorResponse(res, 'Failed to preview migration', 500, error)
  }
})

/**
 * POST /api/update/apply
 * Apply update (download, migrate, deploy)
 */
router.post('/apply', async (req, res) => {
  try {
    const { releaseUrl, version, checksum } = req.body
    const approvedBy = req.user.username

    if (!releaseUrl || !version) {
      return errorResponse(res, 'Missing required fields: releaseUrl, version', 400)
    }

    // Start update in background
    updateService.performUpdate(releaseUrl, version, checksum, approvedBy)
      .catch(error => {
        console.error('Update failed:', error)
      })

    return successResponse(res, {
      message: 'Update started',
      version,
      approvedBy
    })
  } catch (error) {
    return errorResponse(res, 'Failed to start update', 500, error)
  }
})

/**
 * POST /api/update/upload
 * Manual upload of update package (fallback)
 */
router.post('/upload', async (req, res) => {
  try {
    // TODO: Implement file upload with multer
    return errorResponse(res, 'Manual upload not yet implemented', 501)
  } catch (error) {
    return errorResponse(res, 'Failed to upload update', 500, error)
  }
})

/**
 * GET /api/update/progress
 * Get real-time update progress
 */
router.get('/progress', async (req, res) => {
  try {
    const progress = updateService.getProgress()
    return successResponse(res, progress || { status: 'idle', progress: 0 })
  } catch (error) {
    return errorResponse(res, 'Failed to get progress', 500, error)
  }
})

/**
 * GET /api/update/deployment-info
 * Get deployment environment info
 */
router.get('/deployment-info', async (req, res) => {
  try {
    const info = await deploymentDetector.getInfo()
    const canRestart = await deploymentDetector.canRestart()

    return successResponse(res, {
      ...info,
      canRestart
    })
  } catch (error) {
    return errorResponse(res, 'Failed to get deployment info', 500, error)
  }
})

/**
 * POST /api/update/validate
 * Validate migrations without executing
 */
router.post('/validate', async (req, res) => {
  try {
    const validation = await migrationService.validateMigrations()

    return successResponse(res, validation)
  } catch (error) {
    return errorResponse(res, 'Failed to validate migrations', 500, error)
  }
})

export default router
