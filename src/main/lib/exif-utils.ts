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
import { promises as fs } from 'fs'
import exifr from 'exifr'
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

// exifr is primarily a reader library. It does not support writing metadata.
// If writing is a hard requirement, a different approach will be needed.

export async function readImageMetadata(filePath: string): Promise<Record<string, unknown>> {
  try {
    const fileBuffer = await fs.readFile(filePath)
    // You can specify which tags to parse, e.g., { exif: true, iptc: true, xmp: true, userComment: true }
    // For simplicity, let's parse all available for now.
    const output = await exifr.parse(fileBuffer, {
      exif: true,
      iptc: true,
      xmp: true,
      userComment: true
      // Add other tags you might be interested in
    })
    return output
  } catch (error) {
    console.error('Error reading metadata with exifr:', error)
    throw error
  }
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

    // Write the UserComment to stdin
    if (data.UserComment !== undefined) {
      exiftoolProcess.stdin.write(data.UserComment)
    }
    exiftoolProcess.stdin.end() // Close stdin to signal end of input
  })
}
