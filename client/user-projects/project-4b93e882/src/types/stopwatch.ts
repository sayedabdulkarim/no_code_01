/**
 * Represents the current state of the stopwatch
 */
export type StopwatchState = 'idle' | 'running' | 'stopped';

/**
 * Represents the time display format
 */
export interface TimeDisplay {
  minutes: number;
  seconds: number;
  hundredths: number;
}

/**
 * Represents the full state of the stopwatch
 */
export interface StopwatchData {
  state: StopwatchState;
  time: TimeDisplay;
  startTime: number | null;
  elapsedTime: number;
}

/**
 * Represents available actions for the stopwatch
 */
export type StopwatchAction = 'start' | 'stop' | 'reset';