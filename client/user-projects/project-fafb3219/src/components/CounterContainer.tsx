"use client";

import { useState } from 'react';
import CounterDisplay from './CounterDisplay';
import CounterButton from './CounterButton';

export default function CounterContainer() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 rounded-lg bg-white shadow-lg">
      <CounterDisplay count={count} />
      <div className="flex gap-4">
        <CounterButton
          onClick={decrement}
          label="-"
          aria-label="Decrease count"
        />
        <CounterButton
          onClick={increment}
          label="+"
          aria-label="Increase count"
        />
      </div>
    </div>
  );
}