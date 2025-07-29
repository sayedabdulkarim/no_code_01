import { memo } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import type { HexColor } from '../../types/color';

interface HexDisplayProps {
  hexColor: HexColor;
  className?: string;
}

const HexDisplay = memo<HexDisplayProps>(({ hexColor, className = '' }) => {
  const { hasCopied, copyToClipboard } = useClipboard();

  const handleCopy = () => {
    copyToClipboard(hexColor);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
        {hexColor}
      </code>
      <button
        onClick={handleCopy}
        className={`
          px-3 py-1 text-sm rounded transition-colors
          ${hasCopied 
            ? 'bg-green-500 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
        `}
        aria-label={`Copy hex code ${hexColor}`}
      >
        {hasCopied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
});

HexDisplay.displayName = 'HexDisplay';

export default HexDisplay;