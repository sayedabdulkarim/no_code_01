'use client';

import { useState } from 'react';
import ColorPicker from '@/components/ColorPicker/ColorPicker';
import type { Color } from '@/types/color';

export default function Home() {
  const [selectedColor, setSelectedColor] = useState<Color>({
    hex: '#FF0000',
    rgb: { r: 255, g: 0, b: 0 },
    hsv: { h: 0, s: 100, v: 100 }
  });

  const handleColorChange = (color: Color) => {
    setSelectedColor(color);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Color Picker Tool
          </h1>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <ColorPicker 
              initialColor={selectedColor}
              onChange={handleColorChange}
            />
            
            <div className="mt-8 text-sm text-gray-600">
              <h2 className="font-medium mb-2">How to use:</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Click or drag within the color picker to select a color</li>
                <li>The preview swatch shows your selected color</li>
                <li>The hex code is displayed below the preview</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}