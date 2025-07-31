import type { HexColor } from '../types/color';

/**
 * Validates if a string is a valid hex color code
 * @param value - The string to validate
 * @returns boolean indicating if the string is a valid hex color
 */
export const isValidHexColor = (value: string): boolean => {
  // Check if string matches hex color pattern (#RRGGBB or #RGB)
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(value);
};

/**
 * Normalizes a hex color code to the full 6-digit format
 * @param color - The hex color to normalize
 * @returns The normalized 6-digit hex color code
 */
export const normalizeHexColor = (color: string): HexColor => {
  // Remove any whitespace and ensure uppercase
  const cleanColor = color.trim().toUpperCase();
  
  // If it's a 3-digit hex, convert to 6-digit
  if (isValidHexColor(cleanColor) && cleanColor.length === 4) {
    const [, r, g, b] = cleanColor.match(/#(.)(.)(.)/)!;
    return `#${r}${r}${g}${g}${b}${b}` as HexColor;
  }
  
  // If it's already valid 6-digit hex, return as is
  if (isValidHexColor(cleanColor)) {
    return cleanColor as HexColor;
  }
  
  // Return default black for invalid colors
  return '#000000';
};

/**
 * Ensures a color string starts with # if not present
 * @param color - The color string to format
 * @returns The color string with # prefix
 */
export const ensureHexPrefix = (color: string): string => {
  if (!color.startsWith('#')) {
    return `#${color}`;
  }
  return color;
};

/**
 * Validates and formats a color string into a valid HexColor
 * @param color - The color string to validate and format
 * @returns A valid HexColor or null if invalid
 */
export const validateAndFormatHexColor = (color: string): HexColor | null => {
  const formattedColor = ensureHexPrefix(color.trim());
  
  if (!isValidHexColor(formattedColor)) {
    return null;
  }
  
  return normalizeHexColor(formattedColor);
};

/**
 * Calculates the relative luminance of a hex color
 * @param color - The hex color to analyze
 * @returns number between 0 and 1 representing luminance
 */
export const getColorLuminance = (color: HexColor): number => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Using relative luminance formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Determines if a color is light or dark
 * @param color - The hex color to analyze
 * @returns boolean - true if the color is light
 */
export const isLightColor = (color: HexColor): boolean => {
  return getColorLuminance(color) > 0.5;
};