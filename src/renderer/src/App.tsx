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

function App(): React.JSX.Element {
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null)

  const handleFileSelect = (filePath: string): void => {
    setSelectedImagePath(filePath)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel: Settings and Directory */}
      <aside className="min-w-[250px] w-[250px] bg-white p-4 border-r border-gray-200 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Inscribe</h2>
        <div className="flex-1 overflow-auto">
          <FileBrowser onFileSelect={handleFileSelect} />
        </div>
      </aside>

      {/* Right Section: Image Display (Top) and Text Editor (Bottom) */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Image Display (Top) */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="flex-grow flex items-center justify-center bg-gray-200 text-gray-500 p-4 rounded-lg shadow-md max-h-full">
            {selectedImagePath ? (
              <img
                src={`file://${selectedImagePath}`}
                alt="Selected"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              'Image Display Area'
            )}
          </div>
        </main>

        {/* Text Editor (Bottom) */}
        <aside className="min-h-[250px] bg-white p-4 border-t border-gray-200 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Text Editor</h2>
          <div className="flex-1">
            <TextEditor selectedImagePath={selectedImagePath} />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
