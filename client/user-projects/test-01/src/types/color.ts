// Color value type for hex codes
export type HexColor = `#${string}`;

// Interface for preset color options
export interface PresetColor {
  name: string;
  value: HexColor;
}

// Interface for the color picker component props
export interface ColorPickerProps {
  initialColor?: HexColor;
  onColorChange?: (color: HexColor) => void;
  className?: string;
}

// Interface for the color state
export interface ColorState {
  currentColor: HexColor;
  previousColor: HexColor;
}