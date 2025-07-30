import { FC } from 'react';
import ControlButton from './ControlButton';
import { StopwatchState } from '../types/stopwatch';

interface ButtonContainerProps {
  currentState: StopwatchState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const ButtonContainer: FC<ButtonContainerProps> = ({
  currentState,
  onStart,
  onStop,
  onReset
}) => {
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <ControlButton
        action="start"
        currentState={currentState}
        onClick={onStart}
      />
      <ControlButton
        action="stop"
        currentState={currentState}
        onClick={onStop}
      />
      <ControlButton
        action="reset"
        currentState={currentState}
        onClick={onReset}
      />
    </div>
  );
};

export default ButtonContainer;