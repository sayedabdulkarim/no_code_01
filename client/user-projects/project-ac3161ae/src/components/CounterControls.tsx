"use client";

export interface CounterControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  count: number;
  maxCount: number;
}

export default function CounterControls({ onIncrement, onDecrement, onReset, count, maxCount }: CounterControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <button
          onClick={onDecrement}
          disabled={count <= 0}
          className="px-6 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
        >
          -
        </button>
        <button
          onClick={onIncrement}
          disabled={count >= maxCount}
          className="px-6 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
        >
          +
        </button>
      </div>
      <button
        onClick={onReset}
        className="px-6 py-2 bg-gray-500 text-white rounded-lg"
      >
        Reset
      </button>
    </div>
  );
}