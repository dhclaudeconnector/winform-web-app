#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Publish release to GitHub/GitLab
 * Usage: node publish-release.js --version 1.1.0
 */

async function publishRelease() {
  console.log('🚀 Publishing release to Git...\n')

  // Parse arguments
  const args = process.argv.slice(2)
  const getArg = (name) => {
    const index = args.indexOf(`--${name}`)
    return index !== -1 ? args[index + 1] : null
  }

  const version = getArg('version')

  if (!version) {
    console.error('Error: --version is required')
    console.log('Usage: node publish-release.js --version 1.1.0')
    process.exit(1)
  }

  const rootDir = path.join(__dirname, '..')
  const releaseDir = path.join(rootDir, '.release')
  const zipPath = path.join(releaseDir, `release-${version}.zip`)

  try {
    // Step 1: Check if release package exists
    console.log('📦 Checking release package...')
    await fs.access(zipPath)

    // Step 2: Read version.json
    const versionJsonPath = path.join(rootDir, 'version.json')
    const versionData = JSON.parse(await fs.readFile(versionJsonPath, 'utf8'))

    // Step 3: Commit version.json to git
    console.log('📝 Committing version.json...')
    try {
      await execAsync('git add version.json')
      await execAsync(`git commit -m "Release v${version}"`)
      console.log('✅ Committed version.json')
    } catch (error) {
      console.warn('⚠️  Could not commit (maybe no changes)')
    }

    // Step 4: Create git tag
    console.log('🏷️  Creating git tag...')
    try {
      await execAsync(`git tag -a v${version} -m "Release v${version}"`)
      console.log(`✅ Created tag v${version}`)
    } catch (error) {
      console.warn('⚠️  Tag might already exist')
    }

    // Step 5: Push to remote
    console.log('⬆️  Pushing to remote...')
    try {
      await execAsync('git push origin main')
      await execAsync(`git push origin v${version}`)
      console.log('✅ Pushed to remote')
    } catch (error) {
      console.error('❌ Failed to push:', error.message)
      console.log('💡 You may need to push manually:')
      console.log('   git push origin main')
      console.log(`   git push origin v${version}`)
    }

    // Step 6: Create GitHub release (if gh CLI is available)
    console.log('📦 Creating GitHub release...')
    try {
      const releaseNotes = versionData.changelog?.join('\n- ') || 'Release build'
      await execAsync(
        `gh release create v${version} "${zipPath}" --title "Release v${version}" --notes "- ${releaseNotes}"`
      )
      console.log('✅ GitHub release created')
    } catch (error) {
      console.warn('⚠️  Could not create GitHub release (gh CLI not available or not configured)')
      console.log('💡 Manual steps:')
      console.log(`   1. Go to GitHub releases page`)
      console.log(`   2. Create new release for tag v${version}`)
      console.log(`   3. Upload ${zipPath}`)
    }

    console.log('\n✅ Release published successfully!')
    console.log(`📦 Version: ${version}`)
    console.log(`🔗 Customers can now update to this version`)
    console.log(`\n📋 What happens next:`)
    console.log(`   1. Customer systems will auto-detect the new version within 6 hours`)
    console.log(`   2. Admin will see update notification in UI`)
    console.log(`   3. Admin can review and approve the update`)

  } catch (error) {
    console.error('❌ Publish failed:', error)
    process.exit(1)
  }
}

publishRelease().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
