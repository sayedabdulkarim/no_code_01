import { useState, useCallback } from 'react';
import type { ColorPickerProps, HexColor } from '../../types/color';

const DEFAULT_COLOR: HexColor = '#000000';

const ColorPicker: React.FC<ColorPickerProps> = ({
  initialColor = DEFAULT_COLOR,
  onColorChange,
  className = '',
}) => {
  // State for the currently selected color
  const [selectedColor, setSelectedColor] = useState<HexColor>(initialColor);
  // State for copy feedback
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  // Common preset colors
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

  // Handle color selection
  const handleColorSelect = useCallback((color: HexColor) => {
    setSelectedColor(color);
    onColorChange?.(color);
  }, [onColorChange]);

  // Handle hex code copy
  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(selectedColor);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy color code:', err);
    }
  };

  return (
    <div className={`flex flex-col gap-4 p-4 rounded-lg shadow-lg bg-white ${className}`}>
      {/* Color Display Preview */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-lg shadow-inner"
          style={{ backgroundColor: selectedColor }}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Selected Color</span>
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 bg-gray-100 rounded">{selectedColor}</code>
            <button
              onClick={handleCopyHex}
              className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
              {showCopyFeedback ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Area - Placeholder for now */}
      <div className="w-full h-40 bg-gray-100 rounded-lg">
        {/* Color spectrum will be implemented here */}
      </div>

      {/* Preset Colors */}
      <div className="flex flex-wrap gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className="w-8 h-8 rounded-full shadow hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;