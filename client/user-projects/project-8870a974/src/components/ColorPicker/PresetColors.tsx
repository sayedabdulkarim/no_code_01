import { useCallback } from 'react';
import type { HexColor } from '../../types/color';
import { presetColors } from '../../data/presetColors';

interface PresetColorsProps {
  onColorSelect: (color: HexColor) => void;
  selectedColor?: HexColor;
  className?: string;
}

const PresetColors: React.FC<PresetColorsProps> = ({
  onColorSelect,
  selectedColor,
  className = '',
}) => {
  const handleColorSelect = useCallback((color: HexColor) => {
    onColorSelect(color);
  }, [onColorSelect]);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presetColors.map(({ name, value }) => (
        <button
          key={value}
          onClick={() => handleColorSelect(value)}
          className={`
            w-8 h-8 rounded-full shadow 
            hover:scale-110 transition-transform
            ${selectedColor === value ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          `}
          style={{ backgroundColor: value }}
          aria-label={`Select ${name} color: ${value}`}
          title={name}
        />
      ))}
    </div>
  );
};

export default PresetColors;