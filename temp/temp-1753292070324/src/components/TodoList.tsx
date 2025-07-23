'use client';

import { useTodoContext } from '@/context/TodoContext';
import TodoItem from './TodoItem';

export default function TodoList() {
  const { todos } = useTodoContext();

  return (
    <div
      className="flex flex-col gap-3 w-full max-w-md mt-6"
      role="list"
      aria-label="Todo list"
    >
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
        />
      ))}
      {todos.length === 0 && (
        <p className="text-gray-500 text-center italic">
          No todos yet. Add one above!
        </p>
      )}
    </div>
  );
}
