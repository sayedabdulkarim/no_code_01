'use client';

import { useState, useCallback } from 'react';

interface UseCounterProps {
  initialValue?: number;
  min?: number;
  max?: number;
}

export function useCounter({
  initialValue = 0,
  min = 0,
  max = 999
}: UseCounterProps = {}) {
  const [count, setCount] = useState<number>(
    Math.min(Math.max(initialValue, min), max)
  );

  const increment = useCallback(() => {
    setCount((prevCount) => {
      if (prevCount >= max) return prevCount;
      return prevCount + 1;
    });
  }, [max]);

  const decrement = useCallback(() => {
    setCount((prevCount) => {
      if (prevCount <= min) return prevCount;
      return prevCount - 1;
    });
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
    isMinValue: count === min,
    isMaxValue: count === max
  };
}
