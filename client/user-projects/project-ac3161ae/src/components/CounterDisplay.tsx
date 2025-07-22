"use client"

interface CounterDisplayProps {
  count: number
}

export default function CounterDisplay({ count }: CounterDisplayProps) {
  return (
    <div className="flex items-center justify-center p-8 rounded-lg bg-white shadow-lg">
      <span 
        className="text-8xl font-bold text-gray-800 tabular-nums select-none"
        role="status"
        aria-label={`Current count is ${count}`}
      >
        {count}
      </span>
    </div>
  )
}
