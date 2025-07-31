'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { HexColor } from '../../types/color';

interface ColorSpectrumProps {
  onColorSelect: (color: HexColor) => void;
}

export default function ColorSpectrum({ onColorSelect }: ColorSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(0.17, '#FF00FF');
    gradient.addColorStop(0.33, '#0000FF');
    gradient.addColorStop(0.5, '#00FFFF');
    gradient.addColorStop(0.67, '#00FF00');
    gradient.addColorStop(0.83, '#FFFF00');
    gradient.addColorStop(1, '#FF0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add black and white gradients
    const bwGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bwGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    bwGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    bwGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    bwGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    ctx.fillStyle = bwGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    drawSpectrum();
  }, [drawSpectrum]);

  const getColorFromPosition = (x: number, y: number): HexColor => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '#000000';

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + (
      (1 << 24) + 
      (pixel[0] << 16) + 
      (pixel[1] << 8) + 
      pixel[2]
    ).toString(16).slice(1).toUpperCase();

    return hex as HexColor;
  };

  const handleColorPick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const color = getColorFromPosition(x, y);
    onColorSelect(color);
  };

  return (
    <canvas
      ref={canvasRef}
      width="300"
      height="200"
      onClick={handleColorPick}
      className="w-full cursor-pointer rounded-lg shadow-sm"
      aria-label="Color spectrum picker"
    />
  );
}
