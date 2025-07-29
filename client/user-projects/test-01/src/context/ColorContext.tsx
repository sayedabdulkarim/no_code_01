'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ColorContextType {
  color: string;
  setColor: (color: string) => void;
  presetColors: string[];
  copyToClipboard: (text: string) => Promise<void>;
}

const defaultPresetColors = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#000000', // Black
  '#FFFFFF', // White
];

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string>('#000000');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const value = {
    color,
    setColor,
    presetColors: defaultPresetColors,
    copyToClipboard,
  };

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColorContext() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColorContext must be used within a ColorProvider');
  }
  return context;
}