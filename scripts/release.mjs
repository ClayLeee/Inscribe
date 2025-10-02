#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const currentVersion = packageJson.version

console.log(`Current version: ${currentVersion}`)

// Get version type from command line argument
const versionType = process.argv[2]

// If no version type specified, release current version
if (!versionType) {
  console.log('Releasing current version without updating...')

  try {
    // Create and push tag for current version
    console.log('Creating and pushing tag...')
    execSync(`git tag v${currentVersion}`, { stdio: 'inherit' })
    execSync(`git push origin main`, { stdio: 'inherit' })
    execSync(`git push origin v${currentVersion}`, { stdio: 'inherit' })

    console.log(`✅ Release ${currentVersion} created and pushed!`)
    console.log('GitHub Actions will now build and release the app.')
  } catch (error) {
    console.error('Error during release:', error.message)
    process.exit(1)
  }
} else {
  // Version update mode
  if (!['patch', 'minor', 'major', 'prerelease'].includes(versionType)) {
    console.error('Invalid version type. Use: patch, minor, major, or prerelease')
    process.exit(1)
  }

  try {
    // Update version
    console.log(`Updating version (${versionType})...`)
    execSync(`npm version ${versionType}`, { stdio: 'inherit' })

    // Get new version
    const newPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const newVersion = newPackageJson.version

    console.log(`Version updated: ${currentVersion} -> ${newVersion}`)

    // Create and push tag
    console.log('Creating and pushing tag...')
    execSync(`git add package.json`, { stdio: 'inherit' })
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' })
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' })
    execSync(`git push origin main`, { stdio: 'inherit' })
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit' })

    console.log(`✅ Release ${newVersion} created and pushed!`)
    console.log('GitHub Actions will now build and release the app.')
  } catch (error) {
    console.error('Error during release:', error.message)
    process.exit(1)
  }
}
