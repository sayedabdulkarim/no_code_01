import { PresetColor, HexColor } from '../../types/color';

interface PresetColorsProps {
  onColorSelect: (color: HexColor) => void;
  selectedColor: HexColor;
}

const presetColors: PresetColor[] = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Gray', value: '#808080' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Cyan', value: '#00FFFF' },
];

export default function PresetColors({ onColorSelect, selectedColor }: PresetColorsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 font-medium">Preset Colors</p>
      <div className="grid grid-cols-6 gap-2">
        {presetColors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`w-full aspect-square rounded-lg border transition-all hover:scale-105
              ${selectedColor === color.value ? 'border-2 border-blue-500' : 'border-gray-200'}`}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={`Select ${color.name} color`}
          />
        ))}
      </div>
    </div>
  );
}