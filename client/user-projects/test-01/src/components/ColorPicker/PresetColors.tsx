'use client';

import type { HexColor } from '../../types/color';

interface PresetColorsProps {
  onColorSelect: (color: HexColor) => void;
  selectedColor: HexColor;
}

const presetColors: HexColor[] = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFFFF', // White
  '#000000', // Black
];

export default function PresetColors({ onColorSelect, selectedColor }: PresetColorsProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {presetColors.map((color) => (
        <button
          key={color}
          onClick={() => onColorSelect(color)}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
            ${selectedColor === color ? 'border-blue-500' : 'border-gray-200'}`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          title={color}
        />
      ))}
    </div>
  );
}
