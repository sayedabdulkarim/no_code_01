'use client';

import { useState } from 'react';
import { useTodoContext } from '@/context/TodoContext';

export default function TodoInput() {
  const [input, setInput] = useState('');
  const { addTodo } = useTodoContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    
    if (!trimmedInput) return;
    if (trimmedInput.length > 200) return;
    
    addTodo({
      id: Date.now().toString(),
      description: trimmedInput,
      completed: false
    });
    
    setInput('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto mb-6"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Add a new todo..."
          maxLength={200}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="New todo description"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add todo"
        >
          Add
        </button>
      </div>
      {input.length > 200 && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          Task description cannot exceed 200 characters
        </p>
      )}
    </form>
  );
}
