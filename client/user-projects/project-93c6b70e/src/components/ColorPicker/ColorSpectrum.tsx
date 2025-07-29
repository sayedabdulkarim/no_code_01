import { useRef, useEffect } from 'react';
import type { Color } from '@/types/color';
import { useColorSpectrum } from '@/hooks/useColorSpectrum';

interface ColorSpectrumProps {
  initialColor?: Color;
  onChange?: (color: Color) => void;
}

export default function ColorSpectrum({ initialColor, onChange }: ColorSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    coords,
    initCanvas,
    handlePointerMove,
    setIsDragging
  } = useColorSpectrum({
    onChange,
    initialColor
  });

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current) {
      initCanvas(canvasRef.current);
    }
  }, [initCanvas]);

  // Event handlers
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      handlePointerMove(e.clientX, e.clientY, containerRef.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY, containerRef.current);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-64 h-64 rounded-lg overflow-hidden cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      <canvas 
        ref={canvasRef}
        width={256}
        height={256}
        className="w-full h-full"
      />
      
      {/* Selection indicator */}
      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm"
        style={{
          left: `${coords.x * 100}%`,
          top: `${coords.y * 100}%`,
        }}
      />
    </div>
  );
}