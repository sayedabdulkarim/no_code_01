'use client';

import { useState, FormEvent } from 'react';
import { useTodoContext } from '@/context/TodoContext';

export default function TodoInput() {
  const [input, setInput] = useState('');
  const { addTodo } = useTodoContext();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput.length === 0) return;
    if (trimmedInput.length > 280) return;
    
    addTodo({
      id: Date.now().toString(),
      text: trimmedInput,
      completed: false
    });
    
    setInput('');
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex gap-2 mb-6"
      aria-label="Add todo form"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a new todo..."
        maxLength={280}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 focus:border-transparent"
        aria-label="Todo input field"
      />
      <button
        type="submit"
        disabled={input.trim().length === 0}
        className="px-6 py-2 text-white bg-blue-500 rounded-lg 
                 hover:bg-blue-600 focus:outline-none focus:ring-2 
                 focus:ring-blue-500 focus:ring-offset-2 
                 disabled:bg-gray-300 disabled:cursor-not-allowed"
        aria-label="Add todo"
      >
        Add
      </button>
    </form>
  );
}
