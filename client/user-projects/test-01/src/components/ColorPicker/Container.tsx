'use client';

import { useState } from 'react';
import ColorSpectrum from './ColorSpectrum';
import PresetColors from './PresetColors';
import type { HexColor } from '../../types/color';

interface ColorState {
  hex: HexColor;
}

export default function ColorPickerContainer() {
  const [selectedColor, setSelectedColor] = useState<ColorState>({ hex: '#000000' });
  const [isCopied, setIsCopied] = useState(false);

  const handleColorSelect = (color: HexColor) => {
    setSelectedColor({ hex: color });
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(selectedColor.hex);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy hex code:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-6">
        {/* Color Preview */}
        <div className="relative">
          <div 
            className="w-full h-40 rounded-lg border border-gray-200"
            style={{ backgroundColor: selectedColor.hex }}
            role="presentation"
            aria-label={`Selected color: ${selectedColor.hex}`}
          />
        </div>

        {/* Color Spectrum */}
        <ColorSpectrum onColorSelect={handleColorSelect} />

        {/* Preset Colors */}
        <PresetColors 
          onColorSelect={handleColorSelect}
          selectedColor={selectedColor.hex}
        />

        {/* Hex Code Display and Copy Button */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500">Hex Code:</p>
            <p className="text-lg font-mono font-semibold">{selectedColor.hex}</p>
          </div>
          <button
            onClick={handleCopyToClipboard}
            className={`px-4 py-2 rounded-md font-medium transition-colors
              ${isCopied 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            aria-label={`Copy hex code ${selectedColor.hex}`}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}