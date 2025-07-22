"use client";

import { useState } from 'react';
import CounterDisplay from './CounterDisplay';
import CounterControls from './CounterControls';

export default function Counter() {
  const [count, setCount] = useState(0);
  const maxCount = 999;

  const increment = () => count < maxCount && setCount(count + 1);
  const decrement = () => count > 0 && setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 rounded-lg bg-white shadow-lg min-w-[300px]">
      <CounterDisplay count={count} />
      <CounterControls 
        onIncrement={increment}
        onDecrement={decrement}
        onReset={reset}
        count={count}
        maxCount={maxCount}
      />
    </div>
  );
}