import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import AdmZip from 'adm-zip'
import { logger } from '../utils/logger.js'
import { migrationService } from './migrationService.js'
import { versionService } from './versionService.js'
import { deploymentDetector } from './deploymentDetector.js'
import { gitUpdateChecker } from './gitUpdateChecker.js'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Update Service - Orchestrate application updates
 * Handles download, validation, migration, deployment, and rollback
 */
class UpdateService {
  constructor() {
    this.updateTempDir = path.join(__dirname, '../../../update-temp')
    this.backupsDir = path.join(__dirname, '../../../backups')
    this.isUpdating = false
    this.updateProgress = null
  }

  /**
   * Initialize directories
   */
  async init() {
    await fs.mkdir(this.updateTempDir, { recursive: true })
    await fs.mkdir(path.join(this.backupsDir, 'versions'), { recursive: true })
    await fs.mkdir(path.join(this.backupsDir, 'logs'), { recursive: true })
  }

  /**
   * Check for updates
   */
  async checkForUpdates() {
    logger.info('Checking for updates...')
    return await gitUpdateChecker.checkForUpdates()
  }

  /**
   * Download update package
   */
  async downloadUpdate(releaseUrl, version) {
    await this.init()

    const filename = `release-${version}.zip`
    const destPath = path.join(this.updateTempDir, filename)

    // Download
    await gitUpdateChecker.downloadRelease(releaseUrl, destPath)

    return destPath
  }

  /**
   * Extract update package
   */
  async extractUpdate(zipPath) {
    logger.info('Extracting update package...')

    const extractDir = path.join(this.updateTempDir, 'extracted')
    await fs.rm(extractDir, { recursive: true, force: true })
    await fs.mkdir(extractDir, { recursive: true })

    const zip = new AdmZip(zipPath)
    zip.extractAllTo(extractDir, true)

    logger.info('Update package extracted')
    return extractDir
  }

  /**
   * Validate update package structure
   */
  async validatePackage(extractDir) {
    logger.info('Validating update package...')

    const requiredFiles = ['version.json']
    const requiredDirs = ['backend', 'frontend']

    for (const file of requiredFiles) {
      const filepath = path.join(extractDir, file)
      try {
        await fs.access(filepath)
      } catch {
        throw new Error(`Missing required file: ${file}`)
      }
    }

    for (const dir of requiredDirs) {
      const dirpath = path.join(extractDir, dir)
      try {
        await fs.access(dirpath)
      } catch {
        throw new Error(`Missing required directory: ${dir}`)
      }
    }

    // Read and validate version.json
    const versionPath = path.join(extractDir, 'version.json')
    const versionContent = await fs.readFile(versionPath, 'utf8')
    const versionData = JSON.parse(versionContent)

    if (!versionData.version) {
      throw new Error('Invalid version.json: missing version field')
    }

    logger.info('Package validation passed')
    return versionData
  }

  /**
   * Backup current version
   */
  async backupCurrentVersion(version) {
    logger.info(`Creating backup of current version...`)

    const backupDir = path.join(this.backupsDir, 'versions', `backup-${version}-${Date.now()}`)
    await fs.mkdir(backupDir, { recursive: true })

    const rootDir = path.join(__dirname, '../../..')

    // Backup backend
    await this.copyDir(path.join(rootDir, 'backend'), path.join(backupDir, 'backend'))

    // Backup frontend
    await this.copyDir(path.join(rootDir, 'frontend'), path.join(backupDir, 'frontend'))

    // Backup version.json
    await fs.copyFile(
      path.join(rootDir, 'version.json'),
      path.join(backupDir, 'version.json')
    )

    logger.info(`Backup created at: ${backupDir}`)
    return backupDir
  }

  /**
   * Copy directory recursively
   */
  async copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      // Skip node_modules, .next, and other build artifacts
      if (['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        continue
      }

      if (entry.isDirectory()) {
        await this.copyDir(srcPath, destPath)
      } else {
        await fs.copyFile(srcPath, destPath)
      }
    }
  }

  /**
   * Apply code update
   */
  async applyCodeUpdate(extractDir) {
    logger.info('Applying code update...')

    const rootDir = path.join(__dirname, '../../..')

    // Update backend
    await this.copyDir(path.join(extractDir, 'backend'), path.join(rootDir, 'backend'))

    // Update frontend
    await this.copyDir(path.join(extractDir, 'frontend'), path.join(rootDir, 'frontend'))

    // Update version.json
    await fs.copyFile(
      path.join(extractDir, 'version.json'),
      path.join(rootDir, 'version.json')
    )

    logger.info('Code update applied')
  }

  /**
   * Run migrations
   */
  async runMigrations(approvedBy = 'system') {
    logger.info('Running migrations...')

    // Run AUTO migrations
    const autoResult = await migrationService.runAutoMigrations()

    if (!autoResult.success) {
      throw new Error('AUTO migrations failed')
    }

    logger.info(`Executed ${autoResult.executed} AUTO migrations`)
    return autoResult
  }

  /**
   * Health check after update
   */
  async healthCheck(maxRetries = 10, retryDelay = 3000) {
    logger.info('Running health check...')

    const healthUrl = deploymentDetector.getHealthCheckUrl()

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(healthUrl)
        if (response.ok) {
          const data = await response.json()
          logger.info('Health check passed', data)
          return true
        }
      } catch (error) {
        logger.warn(`Health check attempt ${i + 1}/${maxRetries} failed`, error.message)
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    logger.error('Health check failed after all retries')
    return false
  }

  /**
   * Restart application
   */
  async restartApplication() {
    logger.info('Restarting application...')
    return await deploymentDetector.restart()
  }

  /**
   * Rollback to backup
   */
  async rollback(backupDir) {
    logger.error('Rolling back to previous version...')

    const rootDir = path.join(__dirname, '../../..')

    try {
      // Restore backend
      await fs.rm(path.join(rootDir, 'backend'), { recursive: true, force: true })
      await this.copyDir(path.join(backupDir, 'backend'), path.join(rootDir, 'backend'))

      // Restore frontend
      await fs.rm(path.join(rootDir, 'frontend'), { recursive: true, force: true })
      await this.copyDir(path.join(backupDir, 'frontend'), path.join(rootDir, 'frontend'))

      // Restore version.json
      await fs.copyFile(
        path.join(backupDir, 'version.json'),
        path.join(rootDir, 'version.json')
      )

      logger.info('Rollback completed')
      await this.restartApplication()
    } catch (error) {
      logger.error('Rollback failed', error)
      throw error
    }
  }

  /**
   * Perform full update
   */
  async performUpdate(releaseUrl, version, checksum, approvedBy = 'admin') {
    if (this.isUpdating) {
      throw new Error('Update already in progress')
    }

    this.isUpdating = true
    this.updateProgress = {
      status: 'starting',
      progress: 0,
      message: 'Starting update...',
      startTime: new Date()
    }

    let backupDir = null

    try {
      // Step 1: Download
      this.updateProgress = { ...this.updateProgress, status: 'downloading', progress: 10, message: 'Downloading update...' }
      const zipPath = await this.downloadUpdate(releaseUrl, version)

      // Step 2: Verify checksum
      this.updateProgress = { ...this.updateProgress, status: 'verifying', progress: 20, message: 'Verifying checksum...' }
      const checksumValid = await gitUpdateChecker.verifyChecksum(zipPath, checksum)
      if (!checksumValid) {
        throw new Error('Checksum verification failed')
      }

      // Step 3: Extract
      this.updateProgress = { ...this.updateProgress, status: 'extracting', progress: 30, message: 'Extracting package...' }
      const extractDir = await this.extractUpdate(zipPath)

      // Step 4: Validate
      this.updateProgress = { ...this.updateProgress, status: 'validating', progress: 40, message: 'Validating package...' }
      await this.validatePackage(extractDir)

      // Step 5: Backup
      this.updateProgress = { ...this.updateProgress, status: 'backing_up', progress: 50, message: 'Creating backup...' }
      const currentVersion = await versionService.getCurrentVersion()
      backupDir = await this.backupCurrentVersion(currentVersion.version)

      // Step 6: Run migrations
      this.updateProgress = { ...this.updateProgress, status: 'migrating', progress: 60, message: 'Running migrations...' }
      await this.runMigrations(approvedBy)

      // Step 7: Apply code update
      this.updateProgress = { ...this.updateProgress, status: 'applying', progress: 70, message: 'Applying code update...' }
      await this.applyCodeUpdate(extractDir)

      // Step 8: Restart
      this.updateProgress = { ...this.updateProgress, status: 'restarting', progress: 80, message: 'Restarting application...' }
      await this.restartApplication()

      // Step 9: Health check
      this.updateProgress = { ...this.updateProgress, status: 'health_check', progress: 90, message: 'Running health check...' }
      const healthy = await this.healthCheck()

      if (!healthy) {
        throw new Error('Health check failed after update')
      }

      // Step 10: Complete
      this.updateProgress = { ...this.updateProgress, status: 'completed', progress: 100, message: 'Update completed successfully' }
      logger.info(`Update to version ${version} completed successfully`)

      // Cleanup
      await this.cleanup()

      return {
        success: true,
        version,
        backupDir,
        completedAt: new Date()
      }

    } catch (error) {
      logger.error('Update failed', error)
      this.updateProgress = { ...this.updateProgress, status: 'failed', message: error.message }

      // Rollback if we have a backup
      if (backupDir) {
        try {
          await this.rollback(backupDir)
          this.updateProgress = { ...this.updateProgress, status: 'rolled_back', message: 'Update failed, rolled back to previous version' }
        } catch (rollbackError) {
          logger.error('Rollback also failed', rollbackError)
          this.updateProgress = { ...this.updateProgress, status: 'rollback_failed', message: 'Update and rollback both failed' }
        }
      }

      throw error
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanup() {
    logger.info('Cleaning up temporary files...')
    try {
      await fs.rm(this.updateTempDir, { recursive: true, force: true })
      await fs.mkdir(this.updateTempDir, { recursive: true })
    } catch (error) {
      logger.warn('Cleanup failed', error)
    }
  }

  /**
   * Get update progress
   */
  getProgress() {
    return this.updateProgress
  }

  /**
   * Get update status
   */
  getStatus() {
    return {
      isUpdating: this.isUpdating,
      progress: this.updateProgress
    }
  }
}

export const updateService = new UpdateService()
