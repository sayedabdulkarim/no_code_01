'use client';

import { useState } from 'react';
import { useTodoContext } from '@/context/TodoContext';

export default function TodoInput() {
  const [input, setInput] = useState('');
  const { addTodo, todos } = useTodoContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input based on requirements
    const trimmedInput = input.trim();
    if (trimmedInput.length === 0) return;
    if (trimmedInput.length > 100) return;
    if (todos.length >= 50) return;

    // Add the todo
    addTodo(trimmedInput);
    setInput('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Add a new task..."
          maxLength={100}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="New todo input"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Add todo"
        >
          Add
        </button>
      </div>
      {todos.length >= 50 && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          Maximum number of tasks (50) reached
        </p>
      )}
    </form>
  );
}
