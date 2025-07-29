import { useState, useCallback } from 'react';

interface ColorState {
  color: string;
  setColor: (newColor: string) => void;
  isValidColor: (color: string) => boolean;
}

/**
 * Custom hook for managing color state in the color picker application
 * @param initialColor - Initial color in hex format (default: #000000)
 * @returns Object containing color state and management functions
 */
export const useColorState = (initialColor: string = '#000000'): ColorState => {
  const [color, setColorState] = useState<string>(initialColor);

  /**
   * Validates if a string is a valid hex color code
   * @param color - Color string to validate
   * @returns boolean indicating if color is valid
   */
  const isValidColor = useCallback((color: string): boolean => {
    // Check if color is a valid hex code (#RRGGBB or #RGB)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }, []);

  /**
   * Sets the color state after validation
   * @param newColor - New color value in hex format
   */
  const setColor = useCallback((newColor: string): void => {
    // Normalize the color to uppercase and ensure it starts with #
    const normalizedColor = newColor.startsWith('#') 
      ? newColor.toUpperCase()
      : `#${newColor.toUpperCase()}`;

    if (isValidColor(normalizedColor)) {
      setColorState(normalizedColor);
    } else {
      console.warn('Invalid color format provided:', newColor);
    }
  }, [isValidColor]);

  return {
    color,
    setColor,
    isValidColor,
  };
};

export type { ColorState };