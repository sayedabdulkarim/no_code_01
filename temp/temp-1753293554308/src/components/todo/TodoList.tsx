'use client';

import { useContext } from 'react';
import { TodoContext } from '@/context/TodoContext';
import TodoItem from './TodoItem';

export default function TodoList() {
  const { todos } = useContext(TodoContext);

  if (todos.length === 0) {
    return (
      <div 
        className="flex items-center justify-center p-8 text-gray-500 border-2 border-dashed rounded-lg"
        role="region"
        aria-label="Empty todo list"
      >
        <p>No tasks yet. Add a new task to get started!</p>
      </div>
    );
  }

  return (
    <ul
      className="space-y-3"
      role="list"
      aria-label="Todo list"
    >
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoItem todo={todo} />
        </li>
      ))}
    </ul>
  );
}
