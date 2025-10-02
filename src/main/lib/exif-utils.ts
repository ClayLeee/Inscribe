/*
 * This file is part of react-inscribe.
 *
 * react-inscribe is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Copyright (c) 2025 ClayLeee
 */

import { spawn } from 'child_process'
import { app } from 'electron' // Import app from electron
import path from 'path' // Import path module

// Function to get the path to the bundled ExifTool executable
function getExifToolPath(): string {
  let exifToolPath: string
  if (app.isPackaged) {
    // In a packaged app, exiftool.exe is in the resources directory
    exifToolPath = path.join(process.resourcesPath, 'exiftool_dist', 'exiftool.exe')
  } else {
    // In development, it's in the project root's resources/exiftool_dist folder
    exifToolPath = path.join(__dirname, '..', '..', 'resources', 'exiftool_dist', 'exiftool.exe')
  }
  return exifToolPath
}

// Read image metadata using ExifTool
export async function readImageMetadata(filePath: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const exiftoolArgs: string[] = [
      '-charset',
      'UTF8',
      '-charset',
      'iptc=UTF8',
      '-charset',
      'exif=UTF8',
      '-json',
      '-UserComment',
      '-Description',
      '-EXIF:UserComment',
      '-IPTC:Caption-Abstract',
      filePath
    ]

    const exiftoolExecutablePath = getExifToolPath()

    const exiftoolProcess = spawn(exiftoolExecutablePath, exiftoolArgs)

    let stdout = ''
    let stderr = ''

    exiftoolProcess.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    exiftoolProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    exiftoolProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse JSON output from ExifTool
          const metadataArray = JSON.parse(stdout)
          if (Array.isArray(metadataArray) && metadataArray.length > 0) {
            const metadata = metadataArray[0]

            // Convert ExifTool output to a format compatible with the existing code
            const result: Record<string, unknown> = {}

            // Map ExifTool fields to our expected format
            if (metadata.UserComment) {
              result.userComment = metadata.UserComment
            }
            if (metadata.Description) {
              result.description = metadata.Description
            }
            if (metadata['EXIF:UserComment']) {
              result.userComment = metadata['EXIF:UserComment']
            }
            if (metadata['IPTC:Caption-Abstract']) {
              result.description = metadata['IPTC:Caption-Abstract']
            }

            resolve(result)
          } else {
            resolve({})
          }
        } catch (parseError) {
          console.error('Error parsing ExifTool JSON output:', parseError)
          reject(new Error(`Failed to parse ExifTool output: ${parseError}`))
        }
      } else {
        const errorMessage = `ExifTool failed with code ${code}. Stderr: ${stderr}`
        console.error(`Failed to read metadata from ${filePath}:`, errorMessage)
        reject(new Error(errorMessage))
      }
    })

    exiftoolProcess.on('error', (err) => {
      console.error(`Failed to spawn ExifTool process for ${filePath}:`, err)
      reject(new Error(`Failed to spawn ExifTool process: ${err.message}`))
    })
  })
}

export async function writeImageMetadata(
  filePath: string,
  data: { UserComment?: string }
): Promise<{ status: string; message: string }> {
  return new Promise((resolve, reject) => {
    const exiftoolArgs: string[] = [
      '-overwrite_original',
      '-charset',
      'UTF8',
      '-charset',
      'iptc=UTF8',
      '-charset',
      'exif=UTF8',
      filePath, // Image file path comes before stdin arguments
      '-UserComment<=-' // Read UserComment value from stdin
    ]

    const exiftoolExecutablePath = getExifToolPath()

    const exiftoolProcess = spawn(exiftoolExecutablePath, exiftoolArgs)

    let stderr = ''

    exiftoolProcess.stdout.on('data', () => {
      // stdout is not used, but we need to consume the data to prevent hanging
    })

    exiftoolProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    exiftoolProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ status: 'success', message: 'Metadata written successfully.' })
      } else {
        const errorMessage = `ExifTool failed with code ${code}. Stderr: ${stderr}`
        console.error(`Failed to write metadata to ${filePath}:`, errorMessage)
        reject(new Error(errorMessage))
      }
    })

    exiftoolProcess.on('error', (err) => {
      console.error(`Failed to spawn ExifTool process for ${filePath}:`, err)
      reject(new Error(`Failed to spawn ExifTool process: ${err.message}`))
    })

    // Write the UserComment to stdin with proper UTF-8 encoding
    if (data.UserComment !== undefined) {
      // Ensure the text is properly encoded as UTF-8
      const buffer = Buffer.from(data.UserComment, 'utf8')
      exiftoolProcess.stdin.write(buffer)
    }
    exiftoolProcess.stdin.end() // Close stdin to signal end of input
  })
}
