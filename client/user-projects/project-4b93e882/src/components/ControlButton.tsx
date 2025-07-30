import { FC } from 'react';
import { StopwatchAction, StopwatchState } from '../types/stopwatch';

interface ControlButtonProps {
  action: StopwatchAction;
  currentState: StopwatchState;
  onClick: () => void;
}

const ControlButton: FC<ControlButtonProps> = ({ action, currentState, onClick }) => {
  const isDisabled = (): boolean => {
    switch (action) {
      case 'start':
        return currentState === 'running';
      case 'stop':
        return currentState !== 'running';
      case 'reset':
        return false; // Reset is always available
      default:
        return false;
    }
  };

  const getButtonStyles = (): string => {
    const baseStyles = "px-6 py-2 rounded-lg font-semibold text-lg transition-all duration-200";
    const activeStyles = "hover:opacity-90 active:transform active:scale-95";
    const disabledStyles = "opacity-50 cursor-not-allowed";
    
    let colorStyles = "";
    switch (action) {
      case 'start':
        colorStyles = "bg-green-500 text-white";
        break;
      case 'stop':
        colorStyles = "bg-red-500 text-white";
        break;
      case 'reset':
        colorStyles = "bg-gray-500 text-white";
        break;
    }

    return `${baseStyles} ${colorStyles} ${isDisabled() ? disabledStyles : activeStyles}`;
  };

  const getButtonText = (): string => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled()}
      className={getButtonStyles()}
      data-testid={`${action}-button`}
    >
      {getButtonText()}
    </button>
  );
};

export default ControlButton;