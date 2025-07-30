'use client';

import { useState, useEffect, useCallback } from 'react';
import TimeDisplay from './TimeDisplay';
import ButtonContainer from './ButtonContainer';
import { StopwatchState, TimeDisplay as TimeDisplayType } from '../types/stopwatch';

const Stopwatch = () => {
  const [state, setState] = useState<StopwatchState>('idle');
  const [time, setTime] = useState<TimeDisplayType>({ minutes: 0, seconds: 0, hundredths: 0 });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const calculateTime = useCallback((ms: number): TimeDisplayType => {
    const totalHundredths = Math.floor(ms / 10);
    const minutes = Math.floor(totalHundredths / (100 * 60));
    const seconds = Math.floor((totalHundredths % (100 * 60)) / 100);
    const hundredths = totalHundredths % 100;

    return {
      minutes,
      seconds,
      hundredths,
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    
    const updateTimer = () => {
      if (state === 'running' && startTime !== null) {
        const currentTime = Date.now();
        const newElapsedTime = elapsedTime + (currentTime - startTime);
        setTime(calculateTime(newElapsedTime));
        setStartTime(currentTime);
        setElapsedTime(newElapsedTime);
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (state === 'running') {
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [state, startTime, elapsedTime, calculateTime]);

  const handleStart = () => {
    setState('running');
    setStartTime(Date.now());
  };

  const handleStop = () => {
    setState('stopped');
    setStartTime(null);
  };

  const handleReset = () => {
    setState('idle');
    setTime({ minutes: 0, seconds: 0, hundredths: 0 });
    setStartTime(null);
    setElapsedTime(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-white rounded-xl shadow-lg">
      <TimeDisplay time={time} />
      <ButtonContainer
        currentState={state}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />
    </div>
  );
};

export default Stopwatch;