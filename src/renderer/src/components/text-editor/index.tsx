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

interface TextEditorProps {
  selectedImagePath: string | null
}

// Helper function to decode exifr's userComment output
const decodeUserComment = (userComment: unknown): string => {
  if (!userComment) return ''

  // exifr returns userComment as an object with byte values.
  // The first 8 bytes are typically the encoding (e.g., ASCII\0\0\0 or UNICODE\0).
  const bytesArray = Object.values(userComment) as number[]

  let textBytes: number[] = bytesArray
  let encoding: string = 'utf-8' // Default to UTF-8

  if (bytesArray.length >= 8) {
    const headerBytes = bytesArray.slice(0, 8)
    const header = String.fromCharCode(...headerBytes).replace(/\0/g, '') // Remove null terminators

    if (header.startsWith('ASCII')) {
      textBytes = bytesArray.slice(8)
      encoding = 'ascii'
    } else if (header.startsWith('UNICODE')) {
      textBytes = bytesArray.slice(8)
      encoding = 'utf-16le' // Common for UNICODE in EXIF
    } else if (header.startsWith('JIS')) {
      textBytes = bytesArray.slice(8)
      encoding = 'shift-jis' // Or other JIS variant
    } else {
      // If no recognized header, assume the whole thing is the text, default to UTF-8
      textBytes = bytesArray
      encoding = 'utf-8'
    }
  }

  try {
    // Convert number array to Uint8Array for TextDecoder
    const uint8Array = new Uint8Array(textBytes)
    return new TextDecoder(encoding).decode(uint8Array).trim()
  } catch (e) {
    console.warn(`Could not decode userComment bytes with ${encoding} TextDecoder:`, bytesArray, e)
    // Fallback to a simpler decoding if the specific one fails
    try {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytesArray)).trim()
    } catch (e2) {
      console.warn('Fallback UTF-8 decoding also failed:', e2)
      return ''
    }
  }
}

// eslint-disable-next-line react/prop-types
const TextEditor: React.FC<TextEditorProps> = ({ selectedImagePath }) => {
  const [displayedText, setDisplayedText] = useState<string>('') // Text currently in the image
  const [editableText, setEditableText] = useState<string>('') // Text being edited by the user
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

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
        const textFromImage =
          decodeUserComment(metadata?.userComment) || (metadata?.Description as string) || ''
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
        decodeUserComment(updatedMetadata?.userComment) || (updatedMetadata?.Description as string) || ''
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
      <h3 className="text-md font-semibold mb-2">Current Image Text (Read-Only)</h3>
      <div className="w-full p-2 border rounded bg-gray-50 mb-4 min-h-[80px] overflow-auto">
        {displayedText || 'No text found in image.'}
      </div>

      <h3 className="text-md font-semibold mb-2">Edit Image Text</h3>
      <textarea
        className="flex-1 w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        value={editableText}
        onChange={(e) => setEditableText(e.target.value)}
        placeholder="Enter text to store in the image..."
        disabled={loading || !selectedImagePath}
      />
      <button
        onClick={handleSave}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
        disabled={loading || !selectedImagePath}
      >
        {loading ? 'Saving...' : 'Save Text to Image'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {saveStatus && (
        <p
          className={`text-sm mt-2 ${saveStatus.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}
        >
          {saveStatus}
        </p>
      )}
    </div>
  )
}

export default TextEditor
