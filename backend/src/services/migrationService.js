import { pool } from '../config/database.js'
import { logger } from '../utils/logger.js'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Migration Service - Smart database migration runner
 * Supports auto/manual classification based on filename
 */
class MigrationService {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../../migrations')
  }

  /**
   * Parse migration filename to extract metadata
   * Format: [version]_[type]_[risk]_[description].sql
   */
  parseMigrationFilename(filename) {
    const match = filename.match(/^(\d+)_(auto|manual)_(low|medium|high)_(.+)\.sql$/)
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`)
    }

    return {
      version: match[1],
      type: match[2],
      risk: match[3],
      description: match[4].replace(/_/g, ' '),
      filename
    }
  }

  /**
   * Calculate checksum for migration file
   */
  async calculateChecksum(filepath) {
    const content = await fs.readFile(filepath, 'utf8')
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Initialize migrations table if not exists
   */
  async initMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS webauth.schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        migration_type VARCHAR(20) NOT NULL,
        risk_level VARCHAR(20) DEFAULT 'low',
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by VARCHAR(50),
        checksum VARCHAR(64),
        execution_time_ms INTEGER,
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT
      );
    `
    await pool.query(query)
  }

  /**
   * Get all migration files from directory
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir)
      return files
        .filter(f => f.endsWith('.sql') && f !== 'README.md')
        .sort()
    } catch (error) {
      logger.error('Failed to read migrations directory', error)
      return []
    }
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations() {
    await this.initMigrationsTable()
    const result = await pool.query(
      'SELECT version, checksum, status FROM webauth.schema_migrations ORDER BY version'
    )
    return result.rows
  }

  /**
   * Get pending migrations (not yet executed)
   */
  async getPendingMigrations() {
    const files = await this.getMigrationFiles()
    const executed = await this.getExecutedMigrations()
    const executedVersions = new Set(
      executed.filter(m => m.status === 'success').map(m => m.version)
    )

    const pending = []
    for (const file of files) {
      try {
        const meta = this.parseMigrationFilename(file)
        if (!executedVersions.has(meta.version)) {
          const filepath = path.join(this.migrationsDir, file)
          const checksum = await this.calculateChecksum(filepath)
          pending.push({ ...meta, filepath, checksum })
        }
      } catch (error) {
        logger.warn(`Skipping invalid migration file: ${file}`, error)
      }
    }

    return pending
  }

  /**
   * Get pending AUTO migrations (can run without approval)
   */
  async getPendingAutoMigrations() {
    const pending = await this.getPendingMigrations()
    return pending.filter(m => m.type === 'auto')
  }

  /**
   * Get pending MANUAL migrations (need approval)
   */
  async getPendingManualMigrations() {
    const pending = await this.getPendingMigrations()
    return pending.filter(m => m.type === 'manual')
  }

  /**
   * Read migration SQL content
   */
  async readMigrationSQL(filepath) {
    return await fs.readFile(filepath, 'utf8')
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration, approvedBy = 'system') {
    const client = await pool.connect()
    const startTime = Date.now()

    try {
      await client.query('BEGIN')

      // Read and execute migration SQL
      const sql = await this.readMigrationSQL(migration.filepath)
      await client.query(sql)

      // Record migration in tracking table
      const executionTime = Date.now() - startTime
      await client.query(
        `INSERT INTO webauth.schema_migrations
         (version, name, migration_type, risk_level, approved_by, checksum, execution_time_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          migration.version,
          migration.description,
          migration.type,
          migration.risk,
          approvedBy,
          migration.checksum,
          executionTime,
          'success'
        ]
      )

      await client.query('COMMIT')

      logger.info(`Migration executed successfully: ${migration.filename}`, {
        version: migration.version,
        type: migration.type,
        risk: migration.risk,
        executionTime
      })

      return { success: true, executionTime }
    } catch (error) {
      await client.query('ROLLBACK')

      // Record failed migration
      try {
        await pool.query(
          `INSERT INTO webauth.schema_migrations
           (version, name, migration_type, risk_level, approved_by, checksum, status, error_message)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (version) DO UPDATE SET
           status = $7, error_message = $8, executed_at = CURRENT_TIMESTAMP`,
          [
            migration.version,
            migration.description,
            migration.type,
            migration.risk,
            approvedBy,
            migration.checksum,
            'failed',
            error.message
          ]
        )
      } catch (recordError) {
        logger.error('Failed to record migration failure', recordError)
      }

      logger.error(`Migration failed: ${migration.filename}`, error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Run all pending AUTO migrations
   */
  async runAutoMigrations() {
    const autoMigrations = await this.getPendingAutoMigrations()

    if (autoMigrations.length === 0) {
      logger.info('No pending AUTO migrations')
      return { success: true, executed: 0, migrations: [] }
    }

    logger.info(`Found ${autoMigrations.length} pending AUTO migrations`)

    const results = []
    for (const migration of autoMigrations) {
      try {
        const result = await this.executeMigration(migration, 'auto-system')
        results.push({ migration, success: true, ...result })
      } catch (error) {
        results.push({ migration, success: false, error: error.message })
        // Stop on first failure
        break
      }
    }

    const allSuccess = results.every(r => r.success)
    return {
      success: allSuccess,
      executed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      migrations: results
    }
  }

  /**
   * Run a specific MANUAL migration (after approval)
   */
  async runManualMigration(version, approvedBy) {
    const pending = await this.getPendingManualMigrations()
    const migration = pending.find(m => m.version === version)

    if (!migration) {
      throw new Error(`Manual migration ${version} not found or already executed`)
    }

    logger.info(`Running manual migration ${version} approved by ${approvedBy}`)
    return await this.executeMigration(migration, approvedBy)
  }

  /**
   * Get migration status summary
   */
  async getStatus() {
    const files = await this.getMigrationFiles()
    const executed = await this.getExecutedMigrations()
    const pending = await this.getPendingMigrations()
    const pendingAuto = pending.filter(m => m.type === 'auto')
    const pendingManual = pending.filter(m => m.type === 'manual')

    return {
      total: files.length,
      executed: executed.filter(m => m.status === 'success').length,
      failed: executed.filter(m => m.status === 'failed').length,
      pending: pending.length,
      pendingAuto: pendingAuto.length,
      pendingManual: pendingManual.length,
      migrations: {
        executed: executed,
        pendingAuto,
        pendingManual
      }
    }
  }

  /**
   * Dry-run: validate migrations without executing
   */
  async validateMigrations() {
    const pending = await this.getPendingMigrations()
    const errors = []

    for (const migration of pending) {
      try {
        // Check file exists and is readable
        await fs.access(migration.filepath)

        // Check SQL syntax (basic validation)
        const sql = await this.readMigrationSQL(migration.filepath)
        if (!sql.trim()) {
          errors.push({ migration, error: 'Empty migration file' })
        }
        if (!sql.includes('BEGIN') || !sql.includes('COMMIT')) {
          errors.push({ migration, error: 'Missing transaction wrapper (BEGIN/COMMIT)' })
        }
      } catch (error) {
        errors.push({ migration, error: error.message })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const migrationService = new MigrationService()
