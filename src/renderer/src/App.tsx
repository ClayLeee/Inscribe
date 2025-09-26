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

import React, { useState } from 'react'
import FileBrowser from './components/file-browser'
import TextEditor from './components/text-editor'
import iconUrl from './assets/icon.png'

function App(): React.JSX.Element {
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null)

  const handleFileSelect = (filePath: string): void => {
    setSelectedImagePath(filePath)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Panel: File Browser */}
      <aside className="min-w-[320px] w-[320px] bg-white/80 backdrop-blur-sm p-6 border-r border-gray-200/60 flex flex-col shadow-lg">
        <div className="flex items-center mb-6">
          <img src={iconUrl} alt="Inscribe Icon" className="w-8 h-8 rounded-lg mr-3 shadow-sm" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Inscribe
          </h2>
        </div>
        <div className="flex-1 overflow-auto">
          <FileBrowser onFileSelect={handleFileSelect} />
        </div>
      </aside>

      {/* Center Panel: Image Display */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full h-full flex items-center justify-center bg-white/60 backdrop-blur-sm text-gray-500 p-8 rounded-2xl shadow-xl border border-white/20">
          {selectedImagePath ? (
            <img
              src={`file://${selectedImagePath}`}
              alt="Selected"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <p className="text-gray-400 font-medium">Select an image to view</p>
            </div>
          )}
        </div>
      </main>

      {/* Right Panel: Text Editor */}
      <aside className="min-w-[300px] w-[300px] bg-white/80 backdrop-blur-sm p-6 border-l border-gray-200/60 flex flex-col shadow-lg">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Text Editor
          </h2>
        </div>
        <div className="flex-1">
          <TextEditor selectedImagePath={selectedImagePath} />
        </div>
      </aside>
    </div>
  )
}

export default App
