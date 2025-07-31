import { useState, useCallback } from 'react';

interface ColorPickerProps {
  initialColor?: string;
  onChange?: (color: string) => void;
}

const ColorPicker = ({ initialColor = '#ff0000', onChange }: ColorPickerProps) => {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [isDragging, setIsDragging] = useState(false);

  const handleColorChange = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // Get coordinates based on event type
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate relative position
    const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, clientY - rect.top), rect.height);

    // Convert position to color
    const hue = (x / rect.width) * 360;
    const saturation = 100;
    const lightness = 100 - ((y / rect.height) * 100);

    // Convert HSL to Hex
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    // Convert to hex
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    setSelectedColor(color);
    onChange?.(color);
  }, [onChange]);

  return (
    <div className="w-full max-w-md p-4 rounded-lg shadow-lg bg-white">
      <div className="space-y-4">
        {/* Color Preview */}
        <div className="flex items-center space-x-4">
          <div 
            className="w-16 h-16 rounded-lg shadow-inner"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Selected Color</span>
            <span className="text-lg font-mono font-semibold">{selectedColor}</span>
          </div>
        </div>

        {/* Color Picker Canvas */}
        <div 
          className="relative w-full h-48 rounded-lg cursor-crosshair"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleColorChange(e);
          }}
          onMouseMove={(e) => isDragging && handleColorChange(e)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleColorChange(e);
          }}
          onTouchMove={(e) => isDragging && handleColorChange(e)}
          onTouchEnd={() => setIsDragging(false)}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)'
            }}
          />
        </div>

        {/* Hex Code Display */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <span className="text-sm text-gray-600">Hex Code:</span>
          <code className="font-mono bg-white px-3 py-1 rounded border select-all">
            {selectedColor}
          </code>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;