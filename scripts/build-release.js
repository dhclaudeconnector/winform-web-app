#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import AdmZip from 'adm-zip'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Build release package for deployment
 * Usage: node build-release.js --version 1.1.0 --message "Add new features"
 */

async function buildRelease() {
  console.log('🚀 Building release package...\n')

  // Parse arguments
  const args = process.argv.slice(2)
  const getArg = (name) => {
    const index = args.indexOf(`--${name}`)
    return index !== -1 ? args[index + 1] : null
  }

  const version = getArg('version')
  const message = getArg('message') || 'Release build'

  if (!version) {
    console.error('Error: --version is required')
    console.log('Usage: node build-release.js --version 1.1.0 --message "Add new features"')
    process.exit(1)
  }

  const rootDir = path.join(__dirname, '..')
  const releaseDir = path.join(rootDir, '.release')
  const buildDir = path.join(releaseDir, `build-${version}`)

  try {
    // Step 1: Clean and create directories
    console.log('📁 Creating build directory...')
    await fs.rm(releaseDir, { recursive: true, force: true })
    await fs.mkdir(buildDir, { recursive: true })

    // Step 2: Get git commit hash
    console.log('📝 Getting git commit...')
    let gitCommit = 'unknown'
    try {
      const { stdout } = await execAsync('git rev-parse --short HEAD')
      gitCommit = stdout.trim()
    } catch {
      console.warn('⚠️  Could not get git commit hash')
    }

    // Step 3: Copy backend
    console.log('📦 Copying backend...')
    await copyDir(
      path.join(rootDir, 'backend'),
      path.join(buildDir, 'backend'),
      ['node_modules', 'dist', '.env', 'logs']
    )

    // Step 4: Copy frontend
    console.log('📦 Copying frontend...')
    await copyDir(
      path.join(rootDir, 'frontend'),
      path.join(buildDir, 'frontend'),
      ['node_modules', '.next', 'dist', '.env.local']
    )

    // Step 5: Collect migrations
    console.log('📋 Collecting migrations...')
    const migrations = await collectMigrations(rootDir)

    // Step 6: Generate changelog
    console.log('📄 Generating changelog...')
    const changelog = await generateChangelog()

    // Step 7: Create version.json
    console.log('📝 Creating version.json...')
    const versionData = {
      version,
      buildDate: new Date().toISOString(),
      gitCommit,
      environment: 'production',
      description: message,
      migrations,
      changelog
    }

    await fs.writeFile(
      path.join(buildDir, 'version.json'),
      JSON.stringify(versionData, null, 2)
    )

    // Step 8: Create zip package
    console.log('🗜️  Creating zip package...')
    const zipPath = path.join(releaseDir, `release-${version}.zip`)
    await createZip(buildDir, zipPath)

    // Step 9: Calculate checksum
    console.log('🔐 Calculating checksum...')
    const checksum = await calculateChecksum(zipPath)

    // Step 10: Update version.json with checksum
    versionData.checksum = checksum
    versionData.releaseUrl = `https://github.com/user/repo/releases/download/v${version}/release-${version}.zip`

    await fs.writeFile(
      path.join(buildDir, 'version.json'),
      JSON.stringify(versionData, null, 2)
    )

    // Recreate zip with updated version.json
    await fs.rm(zipPath)
    await createZip(buildDir, zipPath)

    // Step 11: Copy version.json to root (for Git commit)
    await fs.copyFile(
      path.join(buildDir, 'version.json'),
      path.join(rootDir, 'version.json')
    )

    // Get file size
    const stats = await fs.stat(zipPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    console.log('\n✅ Release package built successfully!')
    console.log(`📦 Package: release-${version}.zip`)
    console.log(`📏 Size: ${sizeMB} MB`)
    console.log(`🔐 Checksum: ${checksum}`)
    console.log(`📁 Location: ${zipPath}`)
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Test the release package locally`)
    console.log(`   2. Run: node scripts/publish-release.js --version ${version}`)
    console.log(`   3. Or manually upload to GitHub releases`)

  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

async function copyDir(src, dest, exclude = []) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue

    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, exclude)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

async function collectMigrations(rootDir) {
  const migrationsDir = path.join(rootDir, 'backend/migrations')
  const files = await fs.readdir(migrationsDir)

  return files
    .filter(f => f.endsWith('.sql') && f !== 'README.md')
    .map(f => {
      const match = f.match(/^(\d+)_(auto|manual)_(low|medium|high)_(.+)\.sql$/)
      if (match) {
        return {
          file: f,
          version: match[1],
          type: match[2],
          risk: match[3],
          description: match[4].replace(/_/g, ' ')
        }
      }
      return null
    })
    .filter(Boolean)
}

async function generateChangelog() {
  try {
    const { stdout } = await execAsync('git log --oneline -10')
    return stdout.trim().split('\n').map(line => {
      const [, ...message] = line.split(' ')
      return message.join(' ')
    })
  } catch {
    return ['Release build']
  }
}

async function createZip(sourceDir, zipPath) {
  const zip = new AdmZip()
  zip.addLocalFolder(sourceDir)
  zip.writeZip(zipPath)
}

async function calculateChecksum(filepath) {
  const fileBuffer = await fs.readFile(filepath)
  return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

buildRelease().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
