import React from 'react';

interface HexDisplayProps {
  color: string;
  className?: string;
}

const HexDisplay: React.FC<HexDisplayProps> = ({ color, className = '' }) => {
  // Ensure the color is a valid hex code with # prefix
  const formattedColor = color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="w-6 h-6 rounded-sm border border-gray-200"
        style={{ backgroundColor: formattedColor }}
        aria-label="Color preview"
      />
      <span className="font-mono text-lg select-all">{formattedColor}</span>
    </div>
  );
};

export default HexDisplay;