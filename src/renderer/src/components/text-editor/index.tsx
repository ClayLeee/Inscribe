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

import { useState, useEffect } from 'react'
import { Eye, Edit3 } from 'lucide-react'

interface TextEditorProps {
  selectedImagePath: string | null
}

// Helper function to process ExifTool userComment output
const decodeUserComment = (userComment: unknown): string => {
  if (!userComment) return ''

  if (typeof userComment === 'string') {
    // ExifTool returns UTF-8 encoded string directly
    return userComment.trim()
  } else {
    console.warn('Unexpected userComment format from ExifTool:', userComment)
    return ''
  }
}

// eslint-disable-next-line react/prop-types
const TextEditor: React.FC<TextEditorProps> = ({ selectedImagePath }) => {
  const [displayedText, setDisplayedText] = useState<string>('') // Text currently in the image
  const [editableText, setEditableText] = useState<string>('') // Text being edited by the user
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState<boolean>(false) // Toggle between read-only and edit mode

  useEffect(() => {
    const fetchMetadata = async (): Promise<void> => {
      if (!selectedImagePath) {
        setDisplayedText('')
        setEditableText('')
        return
      }

      setLoading(true)
      setError(null)
      setSaveStatus(null)
      try {
        const metadata = await window.api.readImageMetadata(selectedImagePath)

        // Only read from userComment field (which is what we write to)
        const textFromImage = decodeUserComment(metadata?.userComment) || ''

        setDisplayedText(textFromImage)
        setEditableText(textFromImage)
      } catch (err) {
        console.error('Failed to read image metadata:', err)
        setError('Failed to load metadata. Ensure image is valid.')
        setDisplayedText('')
        setEditableText('')
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [selectedImagePath])

  const handleSave = async (): Promise<void> => {
    if (!selectedImagePath) return

    setLoading(true)
    setError(null)
    setSaveStatus(null)
    try {
      const result = await window.api.writeImageMetadata(selectedImagePath, {
        UserComment: editableText
      })
      setSaveStatus(result.message || 'Saved successfully!')
      // After successful save, update displayedText and re-fetch to confirm
      const updatedMetadata = await window.api.readImageMetadata(selectedImagePath)
      setDisplayedText(
        decodeUserComment(updatedMetadata?.userComment) ||
          (updatedMetadata?.Description as string) ||
          ''
      ) // Confirm with re-fetch
    } catch (err) {
      console.error('Failed to write image metadata:', err)
      setError('Failed to save metadata. Check permissions or image validity.')
      setSaveStatus('Save failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6 bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
        <div className="flex-1 mr-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {isEditMode ? 'Edit Image Text' : 'Current Image Text'}
          </h3>
          <p className="text-sm text-gray-500">
            {isEditMode ? 'Modify the text content' : 'View current text content'}
          </p>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !selectedImagePath}
          title={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
        >
          {isEditMode ? <Eye size={16} /> : <Edit3 size={16} />}
          <span className="text-sm font-medium">{isEditMode ? 'View' : 'Edit'}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col bg-white/50 rounded-xl border border-gray-200/50 p-4">
        {isEditMode ? (
          // Edit Mode
          <div className="flex flex-col h-full">
            <div className="flex-1 mb-4">
              <textarea
                className="w-full h-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 transition-all duration-200"
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                placeholder="Enter text to store in the image..."
                disabled={loading || !selectedImagePath}
              />
            </div>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none font-medium"
              disabled={loading || !selectedImagePath}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div>Save</div>
              )}
            </button>
          </div>
        ) : (
          // Read-Only Mode
          <div className="flex-1 w-full bg-white/80 rounded-xl border border-gray-200 p-4 overflow-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {displayedText || (
                <div className="text-center py-8 text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📝</span>
                  </div>
                  <p className="font-medium">No text found in image</p>
                </div>
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
      {saveStatus && (
        <div
          className={`mt-4 p-3 rounded-xl ${
            saveStatus.includes('successfully')
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              saveStatus.includes('successfully') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {saveStatus}
          </p>
        </div>
      )}
    </div>
  )
}

export default TextEditor
