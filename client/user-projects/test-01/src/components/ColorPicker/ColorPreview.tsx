import React from 'react';
import type { HexColor } from '../../types/color';

interface ColorPreviewProps {
  color: HexColor;
  hexCode: HexColor;
  onCopy: () => void;
  showCopyFeedback: boolean;
  className?: string;
}

const ColorPreview: React.FC<ColorPreviewProps> = ({
  color,
  hexCode,
  onCopy,
  showCopyFeedback,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        className="w-16 h-16 rounded-lg shadow-inner"
        style={{ backgroundColor: color }}
        aria-label={`Color preview: ${hexCode}`}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Selected Color</span>
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-gray-100 rounded">{hexCode}</code>
          <button
            onClick={onCopy}
            className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            aria-label="Copy hex code to clipboard"
          >
            {showCopyFeedback ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPreview;