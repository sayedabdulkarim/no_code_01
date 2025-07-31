'use client';

import { useState } from 'react';
import type { HexColor } from '../types/color';

interface ColorDisplayProps {
  hexColor: HexColor;
}

export default function ColorDisplay({ hexColor }: ColorDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hexColor);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy color code:', err);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div
        className="w-full h-24 rounded-md mb-3"
        style={{ backgroundColor: hexColor }}
        role="presentation"
        aria-label={`Color sample: ${hexColor}`}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm">{hexColor}</span>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors
            ${isCopied 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          aria-label={`Copy color code ${hexColor}`}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}