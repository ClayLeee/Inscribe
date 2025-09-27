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

/* eslint-disable react/prop-types */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'

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

// Helper function to check if file is an image
const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(ext)
}

// Thumbnail component for image files with lazy loading and memo optimization
const ImageThumbnail: React.FC<{ filePath: string; filename: string }> = memo(
  ({ filePath, filename }) => {
    const [imageError, setImageError] = useState<boolean>(false)
    const [isLoaded, setIsLoaded] = useState<boolean>(false)

    const handleError = useCallback(() => {
      setImageError(true)
    }, [])

    const handleLoad = useCallback(() => {
      setImageError(false)
      setIsLoaded(true)
    }, [])

    if (imageError) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <span className="text-white text-sm">📄</span>
        </div>
      )
    }

    return (
      <div className="w-8 h-8 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-gray-100">
        {!isLoaded && (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-xs">📷</span>
          </div>
        )}
        <img
          src={`file://${filePath}`}
          alt={filename}
          className={`w-full h-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }
)
ImageThumbnail.displayName = 'ImageThumbnail'

// Memoized file list item component
const FileListItem: React.FC<{
  entry: FileEntry
  fullPath: string
  isImage: boolean
  onEntryClick: (entry: FileEntry) => void
}> = memo(({ entry, fullPath, isImage, onEntryClick }) => {
  const handleClick = useCallback(() => {
    onEntryClick(entry)
  }, [entry, onEntryClick])

  return (
    <div
      className="flex items-center p-3 hover:bg-white/80 cursor-pointer rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200/50 group"
      onClick={handleClick}
    >
      {entry.isDirectory ? (
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <span className="text-white text-sm">📁</span>
        </div>
      ) : isImage ? (
        <ImageThumbnail filePath={fullPath} filename={entry.name} />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <span className="text-white text-sm">📄</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span
          className="font-medium text-gray-700 block truncate group-hover:text-gray-900 transition-colors"
          title={entry.name}
        >
          {entry.name}
        </span>
        {entry.isDirectory && <span className="text-xs text-gray-500">Folder</span>}
        {isImage && <span className="text-xs text-gray-500">Image</span>}
      </div>
    </div>
  )
})
FileListItem.displayName = 'FileListItem'

// Memoized drive list item component
const DriveListItem: React.FC<{
  drive: DriveEntry
  onDriveClick: (drive: DriveEntry) => void
}> = memo(({ drive, onDriveClick }) => {
  const handleClick = useCallback(() => {
    onDriveClick(drive)
  }, [drive, onDriveClick])

  return (
    <div
      className="flex items-center p-3 hover:bg-white/80 cursor-pointer rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200/50 group"
      onClick={handleClick}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
        <span className="text-white text-sm">💾</span>
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="font-medium text-gray-700 block truncate group-hover:text-gray-900 transition-colors"
          title={drive.name}
        >
          {drive.name}
        </span>
        <span className="text-xs text-gray-500">Drive</span>
      </div>
    </div>
  )
})
DriveListItem.displayName = 'DriveListItem'

const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect }) => {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [drives, setDrives] = useState<DriveEntry[]>([])
  const [isShowingDrives, setIsShowingDrives] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Infinite scroll states
  const [displayedFiles, setDisplayedFiles] = useState<FileEntry[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [hasMoreFiles, setHasMoreFiles] = useState<boolean>(true)
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)

  // Dynamic calculation based on container height and item height
  const [filesPerPage, setFilesPerPage] = useState<number>(20) // Default fallback
  const ITEM_HEIGHT = 60 // Approximate height of each file item in pixels

  // Calculate optimal files per page based on container height
  const calculateFilesPerPage = useCallback((containerHeight: number): number => {
    const visibleItems = Math.ceil(containerHeight / ITEM_HEIGHT)
    // Load 2x visible items to provide smooth scrolling buffer
    return Math.max(10, visibleItems * 2)
  }, [])

  // Load more files for infinite scroll
  const loadMoreFiles = useCallback(async (): Promise<void> => {
    if (isLoadingMore || !hasMoreFiles || isShowingDrives) {
      return
    }

    setIsLoadingMore(true)
    try {
      const startIndex = currentPage * filesPerPage
      const endIndex = startIndex + filesPerPage
      const newFiles = files.slice(startIndex, endIndex)

      if (newFiles.length > 0) {
        setDisplayedFiles((prev) => {
          // 防止重複添加相同的檔案
          const existingNames = new Set(prev.map((f) => f.name))
          const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name))
          return [...prev, ...uniqueNewFiles]
        })
        setCurrentPage((prev) => prev + 1)
        setHasMoreFiles(endIndex < files.length)
      } else {
        setHasMoreFiles(false)
      }
    } catch (err) {
      console.error('Failed to load more files:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMoreFiles, isShowingDrives, currentPage, files, filesPerPage])

  // Reset pagination when path changes
  const resetPagination = (): void => {
    setDisplayedFiles([])
    setCurrentPage(0)
    setIsLoadingMore(false)
    setHasMoreFiles(true)
  }

  // Load initial files when path changes
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
        resetPagination()
      } catch (err) {
        console.error('Failed to list files:', err)
        setError('Failed to load directory. Check permissions or path.')
        setFiles([])
        resetPagination()
      }
    }

    if (isShowingDrives) {
      fetchDrives()
    } else if (currentPath) {
      fetchFiles()
    }
  }, [currentPath, isShowingDrives])

  // Calculate files per page when container is available
  useEffect(() => {
    if (scrollContainer) {
      const containerHeight = scrollContainer.clientHeight
      const calculatedFilesPerPage = calculateFilesPerPage(containerHeight)
      setFilesPerPage(calculatedFilesPerPage)
    }
  }, [scrollContainer, calculateFilesPerPage])

  // Load initial page of files when files change
  useEffect(() => {
    if (!isShowingDrives && files.length > 0) {
      const initialFiles = files.slice(0, filesPerPage)
      setDisplayedFiles(initialFiles)
      setCurrentPage(1)
      setHasMoreFiles(files.length > filesPerPage)
    } else if (!isShowingDrives && files.length === 0) {
      // 當 files 為空時，清空 displayedFiles
      setDisplayedFiles([])
      setCurrentPage(0)
      setHasMoreFiles(false)
    }
  }, [files, isShowingDrives, filesPerPage])

  // Update hasMoreFiles when displayedFiles changes
  useEffect(() => {
    if (!isShowingDrives && displayedFiles.length > 0 && files.length > 0) {
      setHasMoreFiles(displayedFiles.length < files.length)
    }
  }, [displayedFiles.length, files.length, isShowingDrives])

  // Debounced scroll handler for better performance
  const debouncedScrollHandler = useCallback(() => {
    if (!scrollContainer || isLoadingMore || !hasMoreFiles) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200 // 200px threshold for smoother loading

    if (isNearBottom) {
      loadMoreFiles()
    }
  }, [scrollContainer, isLoadingMore, hasMoreFiles, loadMoreFiles])

  // Scroll event handler with throttling for better performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        debouncedScrollHandler()
      }, 16) // ~60fps throttling
    }

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }

    return undefined
  }, [scrollContainer, debouncedScrollHandler])

  const handleEntryClick = useCallback(
    (entry: FileEntry): void => {
      const newPath = `${currentPath}${currentPath.endsWith('\\') ? '' : '\\'}${entry.name}`
      if (entry.isDirectory) {
        setCurrentPath(newPath)
      } else {
        onFileSelect(newPath)
      }
    },
    [currentPath, onFileSelect]
  )

  const handleDriveClick = useCallback((drive: DriveEntry): void => {
    setCurrentPath(drive.path)
    setIsShowingDrives(false)
  }, [])

  const handleGoBack = (): void => {
    if (isShowingDrives) {
      // Already at drives list, do nothing
      return
    }

    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'))
    if (parentPath && parentPath.length > 3) {
      // More than just "C:\"
      setCurrentPath(parentPath)
    } else {
      // If at root of a drive, go back to drives list
      setIsShowingDrives(true)
      setCurrentPath('')
    }
  }

  // Memoized file list items to prevent unnecessary re-renders
  const fileListItems = useMemo(() => {
    return displayedFiles.map((entry) => {
      const fullPath = `${currentPath}\\${entry.name}`
      const isImage = !entry.isDirectory && isImageFile(entry.name)

      return (
        <FileListItem
          key={entry.name}
          entry={entry}
          fullPath={fullPath}
          isImage={isImage}
          onEntryClick={handleEntryClick}
        />
      )
    })
  }, [displayedFiles, currentPath, handleEntryClick])

  // Memoized drive list items
  const driveListItems = useMemo(() => {
    return drives.map((drive) => (
      <DriveListItem key={drive.path} drive={drive} onDriveClick={handleDriveClick} />
    ))
  }, [drives, handleDriveClick])

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
      <div
        ref={setScrollContainer}
        className="flex-1 overflow-y-auto bg-white/50 rounded-xl border border-gray-200/50 p-2 space-y-1"
        style={{ willChange: 'scroll-position' }}
      >
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
            {driveListItems}
          </>
        ) : (
          <>
            {displayedFiles.length === 0 && !error && !isLoadingMore && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📁</span>
                </div>
                <p className="text-gray-500 text-sm">No files or folders</p>
              </div>
            )}
            {fileListItems}

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="flex justify-center py-6">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-8 h-8 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">Loading more files...</span>
                  </div>
                </div>
              </div>
            )}

            {/* End of files indicator */}
            {!hasMoreFiles && displayedFiles.length > 0 && (
              <div className="flex justify-center py-4">
                <span className="text-xs text-gray-400">No more files to load</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FileBrowser
