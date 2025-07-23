'use client';

import { useContext, useState } from 'react';
import { TodoContext } from '@/context/TodoContext';

export default function TodoInput() {
  const [inputValue, setInputValue] = useState('');
  const { addTodo } = useContext(TodoContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || trimmedValue.length > 100) return;

    addTodo({
      id: Date.now().toString(),
      text: trimmedValue,
      completed: false
    });

    setInputValue('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="Add a new task"
          maxLength={100}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-transparent transition-colors"
          aria-label="New task input"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg
                   hover:bg-blue-600 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:ring-offset-2
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors"
          aria-label="Add task"
        >
          Add
        </button>
      </div>
    </form>
  );
}
