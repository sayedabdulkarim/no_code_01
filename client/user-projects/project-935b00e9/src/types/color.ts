/**
 * Represents a color in hexadecimal format
 * Example: "#FF0000" for red
 */
export type HexColor = string;

/**
 * Validates if a string is a valid hex color
 */
export type IsValidHexColor = (color: string) => boolean;

/**
 * Color selection coordinates within the picker
 */
export interface ColorPickerCoordinates {
  x: number;
  y: number;
}

/**
 * Color picker dimensions
 */
export interface ColorPickerDimensions {
  width: number;
  height: number;
}

/**
 * Color selection event
 */
export interface ColorSelectionEvent {
  coordinates: ColorPickerCoordinates;
  hexColor: HexColor;
}

/**
 * Props for the color picker component
 */
export interface ColorPickerProps {
  /**
   * Initial color value in hex format
   */
  initialColor?: HexColor;
  
  /**
   * Callback fired when a color is selected
   */
  onColorSelect?: (color: HexColor) => void;
  
  /**
   * Callback fired when color selection changes
   */
  onColorChange?: (event: ColorSelectionEvent) => void;
  
  /**
   * Custom dimensions for the color picker
   */
  dimensions?: ColorPickerDimensions;
  
  /**
   * Whether the hex code should be displayed
   */
  showHexCode?: boolean;
  
  /**
   * Custom class name for styling
   */
  className?: string;
}

/**
 * State for the color picker component
 */
export interface ColorPickerState {
  /**
   * Currently selected color in hex format
   */
  selectedColor: HexColor;
  
  /**
   * Current coordinates of selection within the picker
   */
  coordinates: ColorPickerCoordinates;
  
  /**
   * Whether the user is currently dragging
   */
  isDragging: boolean;
}

/**
 * Color preview component props
 */
export interface ColorPreviewProps {
  /**
   * Color to display in hex format
   */
  color: HexColor;
  
  /**
   * Custom class name for styling
   */
  className?: string;
  
  /**
   * Whether to show the hex code
   */
  showHexCode?: boolean;
}

/**
 * Common utility functions for color manipulation
 */
export interface ColorUtils {
  /**
   * Convert RGB values to hex color
   */
  rgbToHex: (r: number, g: number, b: number) => HexColor;
  
  /**
   * Convert hex color to RGB values
   */
  hexToRgb: (hex: HexColor) => { r: number; g: number; b: number } | null;
  
  /**
   * Validate hex color format
   */
  isValidHex: IsValidHexColor;
}