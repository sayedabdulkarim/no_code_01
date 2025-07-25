'use client';

import { useTodoContext } from '@/context/TodoContext';

type FilterType = 'all' | 'active' | 'completed';

export default function FilterTabs() {
  const { filter, setFilter } = useTodoContext();

  const tabs: FilterType[] = ['all', 'active', 'completed'];

  return (
    <div 
      className="flex justify-center gap-2 my-4"
      role="tablist"
      aria-label="Task filters"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setFilter(tab)}
          className={`
            px-4 py-2 rounded-lg capitalize
            ${filter === tab
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            transition-colors duration-200
          `}
          role="tab"
          aria-selected={filter === tab}
          aria-controls={`${tab}-tasks`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
