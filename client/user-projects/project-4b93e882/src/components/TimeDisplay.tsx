import { FC } from 'react';
import { TimeDisplay as TimeDisplayType } from '../types/stopwatch';

interface TimeDisplayProps {
  time: TimeDisplayType;
}

const TimeDisplay: FC<TimeDisplayProps> = ({ time }) => {
  const formatNumber = (num: number, digits: number = 2): string => {
    return num.toString().padStart(digits, '0');
  };

  return (
    <div className="flex justify-center items-center text-6xl font-mono font-bold tracking-wider">
      <span data-testid="time-display">
        {formatNumber(time.minutes)}:{formatNumber(time.seconds)}:
        {formatNumber(time.hundredths)}
      </span>
    </div>
  );
};

export default TimeDisplay;