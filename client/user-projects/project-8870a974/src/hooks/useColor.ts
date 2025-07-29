'use client';

import { useColorContext } from '../context/ColorContext';

interface UseColorReturn {
  color: string;
  setColor: (color: string) => void;
  presetColors: string[];
  copyToClipboard: (text: string) => Promise<void>;
  isValidHexColor: (color: string) => boolean;
  formatHexColor: (color: string) => string;
}

export function useColor(): UseColorReturn {
  const { color, setColor, presetColors, copyToClipboard } = useColorContext();

  const isValidHexColor = (color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  const formatHexColor = (color: string): string => {
    // Remove any non-hex characters and ensure proper format
    let formatted = color.replace(/[^A-Fa-f0-9]/g, '');
    
    // If we have a 3-character hex, convert to 6 characters
    if (formatted.length === 3) {
      formatted = formatted
        .split('')
        .map(char => char + char)
        .join('');
    }
    
    // Ensure 6 characters and add # prefix
    return formatted.length === 6 ? `#${formatted}` : '#000000';
  };

  return {
    color,
    setColor,
    presetColors,
    copyToClipboard,
    isValidHexColor,
    formatHexColor,
  };
}