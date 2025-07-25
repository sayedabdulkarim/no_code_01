'use client';

import { useTodoContext } from '@/context/TodoContext';

export default function TodoList() {
  const { todos, toggleTodo, deleteTodo } = useTodoContext();

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <ul className="space-y-2" role="list" aria-label="Todo list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
              />
              <span
                className={`text-gray-800 ${todo.completed ? 'line-through text-gray-400' : ''}`}
              >
                {todo.title}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="p-1 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label={`Delete ${todo.title}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      {todos.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No todos yet. Add some tasks to get started!
        </p>
      )}
    </div>
  );
}
