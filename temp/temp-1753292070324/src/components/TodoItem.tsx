'use client';

import { useContext } from 'react';
import { TodoContext } from '@/context/TodoContext';
import { Todo } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const { toggleTodo, deleteTodo } = useContext(TodoContext);

  return (
    <div 
      className="flex items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-sm"
      role="listitem"
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Mark ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <span 
          className={`text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}
        >
          {todo.text}
        </span>
      </div>
      <button
        onClick={() => deleteTodo(todo.id)}
        className="text-gray-500 hover:text-red-600 transition-colors p-1"
        aria-label={`Delete ${todo.text}`}
      >
        ×
      </button>
    </div>
  );
}
