import { useState, useCallback } from 'react';
import type { Color, ColorPickerCoords } from '@/types/color';

interface UseColorSpectrumProps {
  onChange?: (color: Color) => void;
  initialColor?: Color;
}

interface ColorSpectrumState {
  isDragging: boolean;
  canvasContext: CanvasRenderingContext2D | null;
}

export function useColorSpectrum({ onChange, initialColor }: UseColorSpectrumProps) {
  const [state, setState] = useState<ColorSpectrumState>({
    isDragging: false,
    canvasContext: null,
  });

  const [coords, setCoords] = useState<ColorPickerCoords>({ 
    x: initialColor?.hsv?.h !== undefined ? initialColor.hsv.h / 360 : 0,
    y: initialColor?.hsv?.s !== undefined ? 1 - (initialColor.hsv.s / 100) : 1
  });

  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hueGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let i = 0; i <= 1; i += 0.1) {
      hueGradient.addColorStop(i, `hsl(${i * 360}, 100%, 50%)`);
    }
    ctx.fillStyle = hueGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const saturationGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    saturationGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    saturationGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = saturationGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setState(prev => ({ ...prev, canvasContext: ctx }));
  }, []);

  const coordsToColor = useCallback((x: number, y: number): Color => {
    const hue = x * 360;
    const saturation = (1 - y) * 100;
    const value = 100;

    const c = value * saturation / 10000;
    const x1 = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = (value - saturation) / 100;

    let r = 0, g = 0, b = 0;
    if (hue < 60) { r = c; g = x1; b = 0; }
    else if (hue < 120) { r = x1; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x1; }
    else if (hue < 240) { r = 0; g = x1; b = c; }
    else if (hue < 300) { r = x1; g = 0; b = c; }
    else { r = c; g = 0; b = x1; }

    const rgb = {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };

    const hex = '#' + [rgb.r, rgb.g, rgb.b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');

    return {
      hex,
      rgb,
      hsv: { h: hue, s: saturation, v: value }
    };
  }, []);

  const handlePointerMove = useCallback((clientX: number, clientY: number, element: HTMLElement) => {
    if (!state.isDragging) return;

    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setCoords({ x, y });
    const color = coordsToColor(x, y);
    onChange?.(color);
  }, [state.isDragging, coordsToColor, onChange]);

  return {
    coords,
    initCanvas,
    handlePointerMove,
    setIsDragging: (isDragging: boolean) => 
      setState(prev => ({ ...prev, isDragging })),
  };
}