import { useState } from 'react';

interface ColorPreviewProps {
  color: string;
  className?: string;
}

const ColorPreview = ({ color, className = '' }: ColorPreviewProps) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy color code:', err);
    }
  };

  return (
    <div 
      className={`flex items-center space-x-4 p-3 rounded-lg bg-white ${className}`}
    >
      <div 
        className="w-12 h-12 rounded-md shadow-inner"
        style={{ backgroundColor: color }}
        aria-label={`Color preview: ${color}`}
      />
      <div className="flex flex-col flex-grow">
        <span className="text-sm font-medium text-gray-600">Color Code</span>
        <div className="flex items-center justify-between">
          <code className="font-mono text-lg font-semibold">{color}</code>
          <button
            onClick={handleCopyClick}
            className="ml-2 px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 
                     transition-colors duration-200 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Copy color code"
          >
            {copyStatus === 'copied' ? (
              <span className="text-green-600">Copied!</span>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPreview;