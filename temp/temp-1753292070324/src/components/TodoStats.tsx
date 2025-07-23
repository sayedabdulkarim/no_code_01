'use client';

import { useTodoContext } from '@/context/TodoContext';

export default function TodoStats() {
  const { todos } = useTodoContext();

  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;

  return (
    <div className="mb-4 flex justify-between items-center p-4 bg-gray-100 rounded-lg">
      <div className="flex gap-6">
        <div className="text-sm">
          <span className="font-semibold">Total Tasks:</span>
          <span className="ml-2">{totalTasks}</span>
        </div>
        <div className="text-sm">
          <span className="font-semibold">Completed:</span>
          <span className="ml-2">{completedTasks}</span>
        </div>
      </div>
    </div>
  );
}
