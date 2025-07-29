import { memo } from 'react';
import type { Color } from '@/types/color';

interface ColorPreviewProps {
  color: Color;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const ColorPreview = memo(function ColorPreview({ 
  color, 
  size = 'lg',
  className = ''
}: ColorPreviewProps) {
  return (
    <div 
      className={`
        rounded-lg 
        shadow-inner 
        ${sizeClasses[size]} 
        ${className}
      `}
      style={{ backgroundColor: color.hex }}
      role="img"
      aria-label={`Color preview: ${color.hex}`}
    />
  );
});

export default ColorPreview;