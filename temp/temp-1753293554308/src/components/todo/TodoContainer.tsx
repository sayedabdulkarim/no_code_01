'use client';

import { useTodoContext } from '@/context/TodoContext';
import TodoInput from './TodoInput';
import TodoList from './TodoList';

export default function TodoContainer() {
  const { todos } = useTodoContext();
  const remainingTodos = todos.filter(todo => !todo.completed).length;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Todo List</h1>
          <p className="text-sm text-gray-600 mt-2">
            {remainingTodos} {remainingTodos === 1 ? 'task' : 'tasks'} remaining
          </p>
        </header>

        <TodoInput />

        {todos.length === 0 ? (
          <div 
            className="text-center py-8 text-gray-500"
            role="status"
            aria-label="No tasks available"
          >
            No tasks yet. Add one above!
          </div>
        ) : (
          <TodoList />
        )}
      </div>
    </div>
  );
}
