import { useEffect, useRef, useCallback } from 'react';
import type { HexColor } from '../../types/color';
import { hsvToRgb, getColorAtPosition } from '../../utils/colorUtils';

interface ColorSpectrumProps {
  onColorSelect: (color: HexColor) => void;
  className?: string;
}

const ColorSpectrum: React.FC<ColorSpectrumProps> = ({
  onColorSelect,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);

  const drawSpectrum = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create gradient
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const hue = x / width;
        const saturation = 1 - (y / height);
        const value = 1.0;
        
        const { r, g, b } = hsvToRgb(hue, saturation, value);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, []);

  const handleColorSelection = useCallback((event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in event) 
      ? event.touches[0].clientX - rect.left
      : event.clientX - rect.left;
    const y = ('touches' in event)
      ? event.touches[0].clientY - rect.top
      : event.clientY - rect.top;

    // Ensure coordinates are within bounds
    const boundedX = Math.max(0, Math.min(canvas.width, x));
    const boundedY = Math.max(0, Math.min(canvas.height, y));

    const selectedColor = getColorAtPosition(canvas, boundedX, boundedY);
    onColorSelect(selectedColor as HexColor);
  }, [onColorSelect]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawSpectrum(canvas);
  }, [drawSpectrum]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    handleResize();

    // Event handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      handleColorSelection(e);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleColorSelection(e);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true;
      handleColorSelection(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        handleColorSelection(e);
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawSpectrum, handleColorSelection, handleResize]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-40 rounded-lg cursor-crosshair ${className}`}
      role="img"
      aria-label="Color spectrum selector"
    />
  );
};

export default ColorSpectrum;