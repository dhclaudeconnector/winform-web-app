import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Version Service - Manage application version tracking
 */
class VersionService {
  constructor() {
    this.versionFile = path.join(__dirname, '../../../version.json')
  }

  /**
   * Get current version info
   */
  async getCurrentVersion() {
    try {
      const content = await fs.readFile(this.versionFile, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      // Return default version if file doesn't exist
      return {
        version: '1.0.0',
        buildDate: new Date().toISOString(),
        gitCommit: 'unknown',
        environment: process.env.NODE_ENV || 'development'
      }
    }
  }

  /**
   * Update version file
   */
  async updateVersion(versionData) {
    const current = await this.getCurrentVersion()
    const updated = {
      ...current,
      ...versionData,
      updatedAt: new Date().toISOString()
    }
    await fs.writeFile(this.versionFile, JSON.stringify(updated, null, 2))
    return updated
  }

  /**
   * Compare two versions (semver)
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1
      if (parts1[i] < parts2[i]) return -1
    }
    return 0
  }

  /**
   * Check if new version is available
   */
  isNewerVersion(currentVersion, newVersion) {
    return this.compareVersions(newVersion, currentVersion) > 0
  }

  /**
   * Get version history from git
   */
  async getVersionHistory() {
    // This will be implemented when we add git integration
    return []
  }
}

export const versionService = new VersionService()
