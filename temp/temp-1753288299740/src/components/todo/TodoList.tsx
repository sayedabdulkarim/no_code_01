'use client';

import { useTodoContext } from '@/context/TodoContext';
import TodoItem from './TodoItem';

export default function TodoList() {
  const { todos } = useTodoContext();

  return (
    <div
      role="list"
      className="flex flex-col gap-2 w-full max-w-md mx-auto mt-4 p-4 bg-white rounded-lg shadow"
      aria-label="Todo list"
    >
      {todos.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No todos yet. Add your first task above!
        </p>
      ) : (
        todos.map((todo) => (
          <TodoItem
            key={todo.id}
            id={todo.id}
            text={todo.text}
            completed={todo.completed}
          />
        ))
      )}
    </div>
  );
}
