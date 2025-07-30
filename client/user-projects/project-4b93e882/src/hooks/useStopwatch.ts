import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTime, calculateElapsedTime } from '../lib/timeUtils';

interface StopwatchState {
  isRunning: boolean;
  elapsedTime: number;
  displayTime: string;
}

export const useStopwatch = () => {
  const [state, setState] = useState<StopwatchState>({
    isRunning: false,
    elapsedTime: 0,
    displayTime: '00:00:00'
  });

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const updateTime = useCallback(() => {
    if (!startTimeRef.current) return;

    const newElapsedTime = calculateElapsedTime(startTimeRef.current, state.elapsedTime);
    setState(prev => ({
      ...prev,
      elapsedTime: newElapsedTime,
      displayTime: formatTime(newElapsedTime)
    }));

    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [state.elapsedTime]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setState(prev => ({ ...prev, isRunning: true }));
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [updateTime]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = 0;
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = 0;
    setState({
      isRunning: false,
      elapsedTime: 0,
      displayTime: '00:00:00'
    });
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isRunning: state.isRunning,
    displayTime: state.displayTime,
    start,
    stop,
    reset
  };
};