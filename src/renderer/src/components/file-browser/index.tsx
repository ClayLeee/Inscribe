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

interface FileBrowserProps {
  onFileSelect: (filePath: string) => void
}

const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect }) => {
  const [currentPath, setCurrentPath] = useState<string>('C:\\Users\\') // Initial path, can be changed
  const [files, setFiles] = useState<FileEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    fetchFiles()
  }, [currentPath])

  const handleEntryClick = (entry: FileEntry): void => {
    const newPath = `${currentPath}${currentPath.endsWith('\\') ? '' : '\\'}${entry.name}`
    if (entry.isDirectory) {
      setCurrentPath(newPath)
    } else {
      onFileSelect(newPath)
    }
  }

  const handleGoBack = (): void => {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'))
    if (parentPath) {
      setCurrentPath(parentPath)
    } else {
      // If at root of a drive, go to the drive list or similar
      // For simplicity, we'll just stay at the current drive root for now
      setCurrentPath('C:\\') // Or handle drive selection
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-2">
        <button onClick={handleGoBack} className="px-2 py-1 bg-gray-200 rounded mr-2">
          Back
        </button>
        <span className="text-sm truncate">{currentPath}</span>
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex-1 overflow-y-auto border rounded p-2">
        {files.length === 0 && !error && <p className="text-gray-500">No files or folders.</p>}
        {files.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center p-1 hover:bg-gray-100 cursor-pointer rounded"
            onClick={() => handleEntryClick(entry)}
          >
            {entry.isDirectory ? '📁' : '📄'}
            <span className="ml-2">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileBrowser
