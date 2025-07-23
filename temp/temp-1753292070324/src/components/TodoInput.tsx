'use client';

import { useState, useContext } from 'react';
import { TodoContext } from '@/context/TodoContext';

export default function TodoInput() {
  const [input, setInput] = useState('');
  const { addTodo } = useContext(TodoContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput.length === 0 || trimmedInput.length > 100) {
      return;
    }

    addTodo(trimmedInput);
    setInput('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex gap-2 w-full max-w-md mb-6"
      aria-label="Add todo form"
    >
      <input
        type="text"
        value={input}
        onChange={handleChange}
        placeholder="Add a new todo..."
        maxLength={100}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 focus:border-transparent"
        aria-label="Todo input field"
      />
      <button
        type="submit"
        disabled={input.trim().length === 0}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg
                 hover:bg-blue-600 focus:outline-none focus:ring-2
                 focus:ring-blue-500 focus:ring-offset-2
                 disabled:bg-gray-300 disabled:cursor-not-allowed
                 transition-colors duration-200"
        aria-label="Add todo"
      >
        Add
      </button>
    </form>
  );
}
