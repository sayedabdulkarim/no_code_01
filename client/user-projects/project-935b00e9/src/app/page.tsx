'use client';

import { useState } from 'react';
import ColorPicker from '../components/ColorPicker/ColorPicker';

export default function Home() {
  const [selectedColor, setSelectedColor] = useState('#ff0000');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-600">
          Color Pickerr
        </h1>
        
        <div className="flex flex-col items-center gap-6">
          {/* Color Preview */}
          <div 
            className="w-32 h-32 rounded-xl shadow-lg"
            style={{ backgroundColor: selectedColor }}
          />

          {/* Color Picker Component */}
          <ColorPicker 
            initialColor={selectedColor}
            onChange={(color) => setSelectedColor(color)}
          />

          {/* Instructions */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Click or drag in the color picker to select a color.</p>
            <p className="mt-2">Click the hex code to copy it to your clipboard.</p>
          </div>
        </div>
      </main>
    </div>
  );
}