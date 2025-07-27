"use client";

import { useState } from 'react';

export default function ColorPicker() {
  const [color, setColor] = useState('#FF0000');
  const [showCopied, setShowCopied] = useState(false);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(color);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="color"
        value={color}
        onChange={handleColorChange}
        className="w-48 h-48 cursor-pointer"
      />
      <div 
        className="w-48 h-24 rounded-lg shadow-md" 
        style={{ backgroundColor: color }}
      />
      <button
        onClick={copyToClipboard}
        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
      >
        {color.toUpperCase()}
      </button>
      {showCopied && (
        <div className="text-sm text-green-600">Copied to clipboard!</div>
      )}
    </div>
  );
}
