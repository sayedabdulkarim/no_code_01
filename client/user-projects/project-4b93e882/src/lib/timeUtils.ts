/**
 * Formats time in milliseconds to MM:SS:CC format
 * MM = minutes, SS = seconds, CC = centiseconds
 */
export const formatTime = (timeInMs: number): string => {
  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  const centiseconds = Math.floor((timeInMs % 1000) / 10);

  return `${padNumber(minutes)}:${padNumber(seconds)}:${padNumber(centiseconds)}`;
};

/**
 * Pads a number with leading zero if less than 10
 */
const padNumber = (num: number): string => {
  return num.toString().padStart(2, '0');
};

/**
 * Calculates elapsed time between two timestamps
 */
export const calculateElapsedTime = (startTime: number, prevElapsed: number = 0): number => {
  return Date.now() - startTime + prevElapsed;
};