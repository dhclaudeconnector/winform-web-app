import { apiClient } from '../apiClient'

export interface UpdateInfo {
  hasUpdate: boolean
  current: string
  latest: string
  releaseUrl?: string
  checksum?: string
  migrations?: Array<{
    file: string
    version: string
    type: 'auto' | 'manual'
    risk: 'low' | 'medium' | 'high'
    description: string
  }>
  changelog?: string[]
  releaseNotes?: string
}

export interface UpdateStatus {
  currentVersion: {
    version: string
    buildDate: string
    gitCommit: string
  }
  deploymentInfo: {
    type: 'docker' | 'pm2' | 'native'
    pid: number
    platform: string
    nodeVersion: string
  }
  updateStatus: {
    isUpdating: boolean
    progress: UpdateProgress | null
  }
  lastCheckTime: string | null
}

export interface UpdateProgress {
  status: string
  progress: number
  message: string
  startTime: string
}

export interface Migration {
  version: string
  type: 'auto' | 'manual'
  risk: 'low' | 'medium' | 'high'
  description: string
  filename: string
  filepath: string
  checksum: string
}

export interface MigrationPreview {
  migration: {
    version: string
    type: string
    risk: string
    description: string
    filename: string
  }
  sql: string
}

export const updateService = {
  /**
   * Check for new version from Git
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    const response = await apiClient.get('/api/update/check') as any
    return response.data
  },

  /**
   * Get current update status
   */
  async getStatus(): Promise<UpdateStatus> {
    const response = await apiClient.get('/api/update/status') as any
    return response.data
  },

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<{
    pendingAuto: Migration[]
    pendingManual: Migration[]
    summary: {
      totalPending: number
      autoCount: number
      manualCount: number
    }
  }> {
    const response = await apiClient.get('/api/update/migrations/pending') as any
    return response.data
  },

  /**
   * Preview migration SQL
   */
  async previewMigration(version: string): Promise<MigrationPreview> {
    const response = await apiClient.get(`/api/update/migrations/${version}/preview`) as any
    return response.data
  },

  /**
   * Approve and run manual migration
   */
  async approveMigration(version: string): Promise<void> {
    await apiClient.post(`/api/update/migrations/${version}/approve`, {})
  },

  /**
   * Apply update
   */
  async applyUpdate(releaseUrl: string, version: string, checksum?: string): Promise<void> {
    await apiClient.post('/api/update/apply', {
      releaseUrl,
      version,
      checksum
    })
  },

  /**
   * Get update progress
   */
  async getProgress(): Promise<UpdateProgress> {
    const response = await apiClient.get('/api/update/progress') as any
    return response.data
  },

  /**
   * Get deployment info
   */
  async getDeploymentInfo(): Promise<any> {
    const response = await apiClient.get('/api/update/deployment-info') as any
    return response.data
  },

  /**
   * Validate migrations
   */
  async validateMigrations(): Promise<{
    valid: boolean
    errors: Array<{ migration: Migration; error: string }>
  }> {
    const response = await apiClient.post('/api/update/validate', {}) as any
    return response.data
  }
}
