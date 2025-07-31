/**
 * Interface for RGB color values
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Validates if a string is a valid hex color code
 * @param hex - The hex color string to validate
 * @returns boolean indicating if the hex color is valid
 */
export const isValidHexColor = (hex: string): boolean => {
  // Remove # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Check if it's a 3 or 6 character hex code
  const validLength = cleanHex.length === 3 || cleanHex.length === 6;
  const validChars = /^[0-9A-Fa-f]+$/.test(cleanHex);
  
  return validLength && validChars;
};

/**
 * Converts RGB values to a hex color string
 * @param rgb - Object containing r, g, b values (0-255)
 * @returns Hex color string with # prefix
 */
export const rgbToHex = ({ r, g, b }: RGB): string => {
  const toHex = (n: number): string => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Converts a hex color string to RGB values
 * @param hex - The hex color string to convert
 * @returns RGB object or null if invalid hex
 */
export const hexToRgb = (hex: string): RGB | null => {
  if (!isValidHexColor(hex)) {
    return null;
  }

  // Remove # if present
  let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

  // Convert 3-digit hex to 6-digit
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  return { r, g, b };
};

/**
 * Normalizes a hex color string to standard 6-digit format with # prefix
 * @param hex - The hex color string to normalize
 * @returns Normalized hex color string or null if invalid
 */
export const normalizeHexColor = (hex: string): string | null => {
  if (!isValidHexColor(hex)) {
    return null;
  }

  let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

  // Convert 3-digit hex to 6-digit
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }

  return `#${cleanHex.toLowerCase()}`;
};

/**
 * Gets the brightness of a color (0-255)
 * @param hex - The hex color string
 * @returns number between 0-255 representing brightness
 */
export const getColorBrightness = (hex: string): number | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  // Using the formula: (R * 299 + G * 587 + B * 114) / 1000
  return Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
};

/**
 * Determines if white or black text should be used on a background color
 * @param hex - The hex color string of the background
 * @returns boolean - true if white text should be used
 */
export const shouldUseWhiteText = (hex: string): boolean => {
  const brightness = getColorBrightness(hex);
  return brightness !== null && brightness < 128;
};