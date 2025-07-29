import { useState } from 'react';
import type { Color } from '@/types/color';
import { useColorSpectrum } from '@/hooks/useColorSpectrum';

interface ColorPickerProps {
  initialColor?: Color;
  onChange?: (color: Color) => void;
}

export default function ColorPicker({ initialColor, onChange }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<Color>(initialColor || {
    hex: '#FF0000',
    rgb: { r: 255, g: 0, b: 0 },
    hsv: { h: 0, s: 100, v: 100 }
  });

  const { initCanvas, handlePointerMove, setIsDragging } = useColorSpectrum({
    onChange: (color: Color) => {
      setSelectedColor(color);
      onChange?.(color);
    },
    initialColor
  });

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border border-gray-200 shadow-sm bg-white">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-64 h-64 rounded-lg border border-gray-200">
          <canvas
            ref={initCanvas}
            className="w-full h-full rounded-lg"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY, e.currentTarget)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div 
            className="w-32 h-32 rounded-lg shadow-inner"
            style={{ backgroundColor: selectedColor.hex }}
            aria-label="Selected color preview"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Hex Color</label>
            <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 font-mono">
              {selectedColor.hex}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}