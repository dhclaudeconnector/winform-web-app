import https from 'https'
import http from 'http'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { logger } from '../utils/logger.js'
import { versionService } from './versionService.js'

/**
 * Git Update Checker - Check for new releases from Git repository
 * Supports GitHub and GitLab
 */
class GitUpdateChecker {
  constructor() {
    this.gitUrl = process.env.GIT_RELEASE_URL || ''
    this.accessToken = process.env.GIT_ACCESS_TOKEN || ''
    this.checkInterval = parseInt(process.env.UPDATE_CHECK_INTERVAL || '21600000') // 6 hours
    this.autoDownload = process.env.UPDATE_AUTO_DOWNLOAD === 'true'
    this.lastCheckTime = null
    this.latestRemoteVersion = null
  }

  /**
   * Parse Git URL to determine provider and repo info
   */
  parseGitUrl(url) {
    // GitHub: https://github.com/user/repo
    // GitLab: https://gitlab.com/user/repo
    const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    const gitlabMatch = url.match(/gitlab\.com\/([^\/]+)\/([^\/]+)/)

    if (githubMatch) {
      return {
        provider: 'github',
        owner: githubMatch[1],
        repo: githubMatch[2].replace('.git', '')
      }
    }

    if (gitlabMatch) {
      return {
        provider: 'gitlab',
        owner: gitlabMatch[1],
        repo: gitlabMatch[2].replace('.git', '')
      }
    }

    return null
  }

  /**
   * Fetch data from URL with authentication
   */
  async fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
      const headers = {
        'User-Agent': 'WinForm-Update-Service',
        ...options.headers
      }

      if (this.accessToken) {
        headers['Authorization'] = `token ${this.accessToken}`
      }

      const protocol = url.startsWith('https') ? https : http
      const req = protocol.get(url, { headers }, (res) => {
        let data = ''

        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        })
      })

      req.on('error', reject)
      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
    })
  }

  /**
   * Check for updates from GitHub
   */
  async checkGitHub(owner, repo) {
    try {
      // Get version.json from main branch
      const versionUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/version.json`
      const versionData = await this.fetchUrl(versionUrl)
      const remoteVersion = JSON.parse(versionData)

      // Get latest release info
      const releaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`
      const releaseData = await this.fetchUrl(releaseUrl)
      const release = JSON.parse(releaseData)

      return {
        version: remoteVersion.version,
        buildDate: remoteVersion.buildDate,
        gitCommit: remoteVersion.gitCommit,
        releaseUrl: release.assets?.[0]?.browser_download_url || release.zipball_url,
        checksum: remoteVersion.checksum,
        migrations: remoteVersion.migrations || [],
        changelog: remoteVersion.changelog || [],
        releaseNotes: release.body || ''
      }
    } catch (error) {
      logger.error('Failed to check GitHub for updates', error)
      throw error
    }
  }

  /**
   * Check for updates from GitLab
   */
  async checkGitLab(owner, repo) {
    try {
      // Get version.json from main branch
      const versionUrl = `https://gitlab.com/${owner}/${repo}/-/raw/main/version.json`
      const versionData = await this.fetchUrl(versionUrl)
      const remoteVersion = JSON.parse(versionData)

      // Get latest release
      const releaseUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}/releases`
      const releaseData = await this.fetchUrl(releaseUrl)
      const releases = JSON.parse(releaseData)
      const latest = releases[0]

      return {
        version: remoteVersion.version,
        buildDate: remoteVersion.buildDate,
        gitCommit: remoteVersion.gitCommit,
        releaseUrl: latest?.assets?.links?.[0]?.url || '',
        checksum: remoteVersion.checksum,
        migrations: remoteVersion.migrations || [],
        changelog: remoteVersion.changelog || [],
        releaseNotes: latest?.description || ''
      }
    } catch (error) {
      logger.error('Failed to check GitLab for updates', error)
      throw error
    }
  }

  /**
   * Check for new version
   */
  async checkForUpdates() {
    if (!this.gitUrl) {
      logger.warn('GIT_RELEASE_URL not configured, skipping update check')
      return null
    }

    const repoInfo = this.parseGitUrl(this.gitUrl)
    if (!repoInfo) {
      logger.error('Invalid GIT_RELEASE_URL format')
      return null
    }

    logger.info(`Checking for updates from ${repoInfo.provider}...`)
    this.lastCheckTime = new Date()

    try {
      let remoteVersion
      if (repoInfo.provider === 'github') {
        remoteVersion = await this.checkGitHub(repoInfo.owner, repoInfo.repo)
      } else if (repoInfo.provider === 'gitlab') {
        remoteVersion = await this.checkGitLab(repoInfo.owner, repoInfo.repo)
      }

      const currentVersion = await versionService.getCurrentVersion()
      const hasUpdate = versionService.isNewerVersion(currentVersion.version, remoteVersion.version)

      this.latestRemoteVersion = remoteVersion

      if (hasUpdate) {
        logger.info(`New version available: ${remoteVersion.version} (current: ${currentVersion.version})`)
        return {
          hasUpdate: true,
          current: currentVersion.version,
          latest: remoteVersion.version,
          ...remoteVersion
        }
      } else {
        logger.info(`No updates available (current: ${currentVersion.version})`)
        return {
          hasUpdate: false,
          current: currentVersion.version,
          latest: remoteVersion.version
        }
      }
    } catch (error) {
      logger.error('Update check failed', error)
      return null
    }
  }

  /**
   * Download release package
   */
  async downloadRelease(releaseUrl, destPath) {
    logger.info(`Downloading release from ${releaseUrl}...`)

    return new Promise((resolve, reject) => {
      const protocol = releaseUrl.startsWith('https') ? https : http
      const headers = {}

      if (this.accessToken) {
        headers['Authorization'] = `token ${this.accessToken}`
      }

      const file = require('fs').createWriteStream(destPath)

      protocol.get(releaseUrl, { headers }, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          return this.downloadRelease(response.headers.location, destPath)
            .then(resolve)
            .catch(reject)
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${response.statusCode}`))
          return
        }

        const totalSize = parseInt(response.headers['content-length'] || '0')
        let downloaded = 0

        response.on('data', (chunk) => {
          downloaded += chunk.length
          const progress = totalSize ? (downloaded / totalSize * 100).toFixed(1) : '?'
          logger.debug(`Download progress: ${progress}%`)
        })

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          logger.info('Download completed')
          resolve(destPath)
        })
      }).on('error', (err) => {
        require('fs').unlink(destPath, () => {})
        reject(err)
      })
    })
  }

  /**
   * Verify downloaded file checksum
   */
  async verifyChecksum(filepath, expectedChecksum) {
    if (!expectedChecksum) {
      logger.warn('No checksum provided, skipping verification')
      return true
    }

    const fileBuffer = await fs.readFile(filepath)
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    if (hash === expectedChecksum) {
      logger.info('Checksum verification passed')
      return true
    } else {
      logger.error('Checksum verification failed', { expected: expectedChecksum, actual: hash })
      return false
    }
  }

  /**
   * Get last check time
   */
  getLastCheckTime() {
    return this.lastCheckTime
  }

  /**
   * Get latest remote version info
   */
  getLatestRemoteVersion() {
    return this.latestRemoteVersion
  }

  /**
   * Start auto-check interval
   */
  startAutoCheck(callback) {
    if (!process.env.UPDATE_CHECK_ENABLED || process.env.UPDATE_CHECK_ENABLED === 'false') {
      logger.info('Auto-check disabled')
      return
    }

    logger.info(`Starting auto-check with interval: ${this.checkInterval}ms (${this.checkInterval / 3600000}h)`)

    // Check immediately on start
    this.checkForUpdates().then(callback).catch(err => {
      logger.error('Initial update check failed', err)
    })

    // Then check periodically
    setInterval(() => {
      this.checkForUpdates().then(callback).catch(err => {
        logger.error('Periodic update check failed', err)
      })
    }, this.checkInterval)
  }
}

export const gitUpdateChecker = new GitUpdateChecker()
