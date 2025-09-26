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

import React, { useState, useEffect } from 'react'

interface FileEntry {
  name: string
  isDirectory: boolean
}

interface DriveEntry {
  name: string
  path: string
}

interface FileBrowserProps {
  onFileSelect: (filePath: string) => void
}

const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect }) => {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [drives, setDrives] = useState<DriveEntry[]>([])
  const [isShowingDrives, setIsShowingDrives] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDrives = async (): Promise<void> => {
      try {
        setError(null)
        const drivePaths = await window.api.getDrives()
        const driveEntries = drivePaths.map((path) => ({
          name: path.replace('\\', ''),
          path: path
        }))
        setDrives(driveEntries)
      } catch (err) {
        console.error('Failed to get drives:', err)
        setError('Failed to load drives.')
        setDrives([])
      }
    }

    const fetchFiles = async (): Promise<void> => {
      try {
        setError(null)
        const fetchedFiles = await window.api.listFiles(currentPath)
        setFiles(fetchedFiles)
      } catch (err) {
        console.error('Failed to list files:', err)
        setError('Failed to load directory. Check permissions or path.')
        setFiles([])
      }
    }

    if (isShowingDrives) {
      fetchDrives()
    } else if (currentPath) {
      fetchFiles()
    }
  }, [currentPath, isShowingDrives])

  const handleEntryClick = (entry: FileEntry): void => {
    const newPath = `${currentPath}${currentPath.endsWith('\\') ? '' : '\\'}${entry.name}`
    if (entry.isDirectory) {
      setCurrentPath(newPath)
    } else {
      onFileSelect(newPath)
    }
  }

  const handleDriveClick = (drive: DriveEntry): void => {
    setCurrentPath(drive.path)
    setIsShowingDrives(false)
  }

  const handleGoBack = (): void => {
    if (isShowingDrives) {
      // Already at drives list, do nothing
      return
    }

    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'))
    if (parentPath && parentPath.length > 3) { // More than just "C:\"
      setCurrentPath(parentPath)
    } else {
      // If at root of a drive, go back to drives list
      setIsShowingDrives(true)
      setCurrentPath('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Bar */}
      <div className="flex items-center mb-4 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
        <button
          onClick={handleGoBack}
          className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg mr-3 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isShowingDrives}
        >
          <span className="text-sm font-medium">← Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <span
            className="text-sm text-gray-600 truncate block cursor-help"
            title={isShowingDrives ? 'Select a drive to browse' : currentPath}
          >
            {isShowingDrives ? 'Select Drive' : currentPath}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto bg-white/50 rounded-xl border border-gray-200/50 p-2 space-y-1">
        {isShowingDrives ? (
          <>
            {drives.length === 0 && !error && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">💾</span>
                </div>
                <p className="text-gray-500 text-sm">No drives found</p>
              </div>
            )}
            {drives.map((drive) => (
              <div
                key={drive.path}
                className="flex items-center p-3 hover:bg-white/80 cursor-pointer rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200/50 group"
                onClick={() => handleDriveClick(drive)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white text-sm">💾</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-700 block truncate group-hover:text-gray-900 transition-colors" title={drive.name}>
                    {drive.name}
                  </span>
                  <span className="text-xs text-gray-500">Drive</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {files.length === 0 && !error && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📁</span>
                </div>
                <p className="text-gray-500 text-sm">No files or folders</p>
              </div>
            )}
            {files.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center p-3 hover:bg-white/80 cursor-pointer rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200/50 group"
                onClick={() => handleEntryClick(entry)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${
                  entry.isDirectory
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                  <span className="text-white text-sm">
                    {entry.isDirectory ? '📁' : '📄'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-700 block truncate group-hover:text-gray-900 transition-colors" title={entry.name}>
                    {entry.name}
                  </span>
                  {entry.isDirectory && (
                    <span className="text-xs text-gray-500">Folder</span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default FileBrowser
