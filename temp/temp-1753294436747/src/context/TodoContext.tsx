'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Todo, TodoContextType } from '@/types/todo';

export const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function useTodoContext() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within TodoProvider');
  }
  return context;
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = useCallback((description: string) => {
    if (!description.trim() || description.length > 200) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      description: description.trim(),
      isCompleted: false,
      createdAt: Date.now()
    };

    setTodos(prev => [...prev, newTodo]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, isCompleted: !todo.isCompleted }
          : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const totalTodos = useMemo(() => todos.length, [todos]);
  const completedTodos = useMemo(
    () => todos.filter(todo => todo.isCompleted).length,
    [todos]
  );

  const value = {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    totalTodos,
    completedTodos
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}
