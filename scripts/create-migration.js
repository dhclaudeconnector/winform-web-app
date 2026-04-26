#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Create new migration file with proper naming convention
 * Usage: node create-migration.js --type auto --risk low --name "add_audit_table"
 */

async function createMigration() {
  // Parse arguments
  const args = process.argv.slice(2)
  const getArg = (name) => {
    const index = args.indexOf(`--${name}`)
    return index !== -1 ? args[index + 1] : null
  }

  const type = getArg('type') || 'auto'
  const risk = getArg('risk') || 'low'
  const name = getArg('name')

  // Validate arguments
  if (!name) {
    console.error('Error: --name is required')
    console.log('Usage: node create-migration.js --type auto --risk low --name "add_audit_table"')
    process.exit(1)
  }

  if (!['auto', 'manual'].includes(type)) {
    console.error('Error: --type must be "auto" or "manual"')
    process.exit(1)
  }

  if (!['low', 'medium', 'high'].includes(risk)) {
    console.error('Error: --risk must be "low", "medium", or "high"')
    process.exit(1)
  }

  // Get next version number
  const migrationsDir = path.join(__dirname, '../backend/migrations')
  await fs.mkdir(migrationsDir, { recursive: true })

  const files = await fs.readdir(migrationsDir)
  const migrationFiles = files.filter(f => f.match(/^\d+_/))

  let nextVersion = 1
  if (migrationFiles.length > 0) {
    const versions = migrationFiles.map(f => parseInt(f.split('_')[0]))
    nextVersion = Math.max(...versions) + 1
  }

  const versionStr = String(nextVersion).padStart(3, '0')
  const filename = `${versionStr}_${type}_${risk}_${name}.sql`
  const filepath = path.join(migrationsDir, filename)

  // Create migration template
  const template = `-- Migration: ${versionStr}_${type}_${risk}_${name}
-- Version: 1.0.0
-- Type: ${type}
-- Risk: ${risk}
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: ${name.replace(/_/g, ' ')}
-- Author: developer@example.com

BEGIN;

-- Your SQL statements here
-- Example:
-- CREATE TABLE IF NOT EXISTS webauth.example_table (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

COMMIT;
`

  await fs.writeFile(filepath, template)

  console.log('✅ Migration created successfully!')
  console.log(`📄 File: ${filename}`)
  console.log(`📁 Path: ${filepath}`)
  console.log(`\n⚠️  Remember to:`)
  console.log(`   1. Edit the SQL statements in the migration file`)
  console.log(`   2. Test the migration on a development database`)
  console.log(`   3. Commit the migration file to version control`)
}

createMigration().catch(error => {
  console.error('Error creating migration:', error)
  process.exit(1)
})
