'use client';

import { useTodoContext } from '@/context/TodoContext';

export default function TaskCounter() {
  const { todos } = useTodoContext();
  
  const remainingTasks = todos.filter(todo => !todo.completed).length;
  const taskText = remainingTasks === 1 ? 'task' : 'tasks';

  return (
    <div 
      className="text-sm text-gray-600 py-2"
      aria-live="polite"
      role="status"
    >
      <span className="font-medium">{remainingTasks}</span>
      {' '}{taskText} remaining
    </div>
  );
}
