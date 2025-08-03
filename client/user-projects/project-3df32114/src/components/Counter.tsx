'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Counter display */}
      <div className="text-6xl font-bold">{count}</div>
      
      {/* Control buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setCount(prev => prev - 1)}
          className="px-6 py-3 text-lg font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Decrease
        </button>
        <button
          onClick={() => setCount(prev => prev + 1)}
          className="px-6 py-3 text-lg font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          Increase
        </button>
      </div>
    </div>
  );
}