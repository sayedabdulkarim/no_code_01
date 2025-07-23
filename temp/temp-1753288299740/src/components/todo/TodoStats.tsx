'use client';

import { useTodoContext } from '@/context/TodoContext';

export default function TodoStats() {
  const { todos } = useTodoContext();

  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;

  return (
    <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg mb-4">
      <div className="flex gap-6">
        <div className="text-sm">
          <span className="font-medium">Total: </span>
          <span className="text-gray-600">{totalTasks}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Completed: </span>
          <span className="text-gray-600">{completedTasks}</span>
        </div>
      </div>
    </div>
  );
}
