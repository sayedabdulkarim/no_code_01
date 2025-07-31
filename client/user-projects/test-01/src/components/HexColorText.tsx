import React from 'react';

interface HexColorTextProps {
  hexColor: string;
  className?: string;
}

const HexColorText: React.FC<HexColorTextProps> = ({ hexColor, className = '' }) => {
  // Ensure the hex color is properly formatted
  const formattedHexColor = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;

  return (
    <span className={`text-black font-mono ${className}`.trim()}>
      {formattedHexColor.toUpperCase()}
    </span>
  );
};

export default HexColorText;