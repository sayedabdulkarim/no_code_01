export interface CounterDisplayProps {
  count: number;
}

export default function CounterDisplay({ count }: CounterDisplayProps) {
  return (
    <div className="text-4xl font-bold">
      {count}
    </div>
  );
}