/**
 * Represents a color in different formats
 */
export interface Color {
  hex: string;      // Hexadecimal representation (e.g., "#FF0000")
  rgb: RGBColor;    // RGB representation
  hsv: HSVColor;    // HSV representation
}

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number;  // Red (0-255)
  g: number;  // Green (0-255)
  b: number;  // Blue (0-255)
}

/**
 * HSV color representation
 */
export interface HSVColor {
  h: number;  // Hue (0-360)
  s: number;  // Saturation (0-100)
  v: number;  // Value (0-100)
}

/**
 * Color picker selection coordinates
 */
export interface ColorPickerCoords {
  x: number;  // X coordinate (0-1)
  y: number;  // Y coordinate (0-1)
}

/**
 * Color validation result
 */
export interface ColorValidationResult {
  isValid: boolean;
  error?: string;
}