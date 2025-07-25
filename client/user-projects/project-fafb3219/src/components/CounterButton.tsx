interface CounterButtonProps {
  onClick: () => void;
  label: string;
  'aria-label': string;
}

export default function CounterButton({ onClick, label, 'aria-label': ariaLabel }: CounterButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="px-6 py-2 text-xl font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
    >
      {label}
    </button>
  );
}