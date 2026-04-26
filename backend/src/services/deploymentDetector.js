import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)

/**
 * Deployment Detector - Auto-detect deployment environment
 * Supports: Docker, PM2, Native Node.js
 */
class DeploymentDetector {
  constructor() {
    this.detectedType = null
  }

  /**
   * Detect deployment type
   */
  async detect() {
    if (this.detectedType) {
      return this.detectedType
    }

    // Check environment variable override
    const envType = process.env.DEPLOYMENT_TYPE
    if (envType && ['docker', 'pm2', 'native'].includes(envType)) {
      this.detectedType = envType
      logger.info(`Deployment type set from env: ${envType}`)
      return envType
    }

    // Auto-detect Docker
    if (await this.isDocker()) {
      this.detectedType = 'docker'
      logger.info('Detected deployment type: Docker')
      return 'docker'
    }

    // Auto-detect PM2
    if (await this.isPM2()) {
      this.detectedType = 'pm2'
      logger.info('Detected deployment type: PM2')
      return 'pm2'
    }

    // Default to native
    this.detectedType = 'native'
    logger.info('Detected deployment type: Native Node.js')
    return 'native'
  }

  /**
   * Check if running in Docker
   */
  async isDocker() {
    try {
      // Check for .dockerenv file
      await fs.access('/.dockerenv')
      return true
    } catch {
      // Check cgroup for docker
      try {
        const cgroup = await fs.readFile('/proc/1/cgroup', 'utf8')
        return cgroup.includes('docker')
      } catch {
        return false
      }
    }
  }

  /**
   * Check if running under PM2
   */
  async isPM2() {
    return !!(process.env.PM2_HOME || process.env.pm_id !== undefined)
  }

  /**
   * Get deployment info
   */
  async getInfo() {
    const type = await this.detect()
    const info = {
      type,
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime()
    }

    if (type === 'docker') {
      info.containerId = await this.getDockerContainerId()
      info.dockerComposePath = process.env.DOCKER_COMPOSE_PATH || '/app/docker-compose.yml'
    }

    if (type === 'pm2') {
      info.pm2Id = process.env.pm_id
      info.pm2Name = process.env.name
      info.ecosystemPath = process.env.PM2_ECOSYSTEM_PATH || '/app/ecosystem.config.js'
    }

    return info
  }

  /**
   * Get Docker container ID
   */
  async getDockerContainerId() {
    try {
      const hostname = await fs.readFile('/etc/hostname', 'utf8')
      return hostname.trim()
    } catch {
      return 'unknown'
    }
  }

  /**
   * Restart application based on deployment type
   */
  async restart() {
    const type = await this.detect()
    logger.info(`Restarting application (${type})...`)

    try {
      switch (type) {
        case 'docker':
          return await this.restartDocker()
        case 'pm2':
          return await this.restartPM2()
        case 'native':
          return await this.restartNative()
        default:
          throw new Error(`Unknown deployment type: ${type}`)
      }
    } catch (error) {
      logger.error('Failed to restart application', error)
      throw error
    }
  }

  /**
   * Restart Docker containers
   */
  async restartDocker() {
    const composePath = process.env.DOCKER_COMPOSE_PATH || 'docker-compose.yml'

    try {
      // Restart using docker-compose
      logger.info('Restarting Docker containers...')
      const { stdout, stderr } = await execAsync(`docker-compose -f ${composePath} restart`)

      if (stderr) {
        logger.warn('Docker restart stderr:', stderr)
      }

      logger.info('Docker containers restarted successfully')
      return { success: true, output: stdout }
    } catch (error) {
      logger.error('Docker restart failed', error)
      throw new Error(`Docker restart failed: ${error.message}`)
    }
  }

  /**
   * Restart PM2 process
   */
  async restartPM2() {
    try {
      const processName = process.env.name || 'winform-backend'
      logger.info(`Restarting PM2 process: ${processName}`)

      const { stdout, stderr } = await execAsync(`pm2 reload ${processName} --update-env`)

      if (stderr && !stderr.includes('successfully')) {
        logger.warn('PM2 restart stderr:', stderr)
      }

      logger.info('PM2 process restarted successfully')
      return { success: true, output: stdout }
    } catch (error) {
      logger.error('PM2 restart failed', error)
      throw new Error(`PM2 restart failed: ${error.message}`)
    }
  }

  /**
   * Restart native Node.js process
   */
  async restartNative() {
    logger.info('Sending graceful restart signal to native process...')

    // Send SIGUSR2 for graceful restart (if supported by process manager)
    // Or exit and let process manager restart
    process.kill(process.pid, 'SIGUSR2')

    // If no process manager, schedule exit
    setTimeout(() => {
      logger.info('Exiting for restart...')
      process.exit(0)
    }, 1000)

    return { success: true, output: 'Restart signal sent' }
  }

  /**
   * Check if can restart (has necessary permissions/tools)
   */
  async canRestart() {
    const type = await this.detect()

    try {
      switch (type) {
        case 'docker':
          // Check if docker-compose is available
          await execAsync('docker-compose --version')
          return true
        case 'pm2':
          // Check if PM2 is available
          await execAsync('pm2 --version')
          return true
        case 'native':
          // Native can always restart (exit)
          return true
        default:
          return false
      }
    } catch {
      return false
    }
  }

  /**
   * Get health check URL
   */
  getHealthCheckUrl() {
    const port = process.env.PORT || 3001
    return `http://localhost:${port}/health`
  }
}

export const deploymentDetector = new DeploymentDetector()
