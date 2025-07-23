'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Todo, TodoContextType } from '@/types/todo';

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: text.slice(0, 100),
      completed: false,
      createdAt: Date.now()
    };
    
    setTodos(prev => [...prev, newTodo]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    if (!text.trim()) return;
    
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, text: text.slice(0, 100) } : todo
      )
    );
  }, []);

  const remainingTodos = todos.filter(todo => !todo.completed).length;

  const value = {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    remainingTodos
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
}