'use client';

import TodoInput from './TodoInput';
import TodoList from './TodoList';
import TodoStats from './TodoStats';

export default function TodoContainer() {
  return (
    <main className="min-h-screen w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Todo List
        </h1>
        
        <div className="space-y-6">
          <TodoInput />
          <TodoStats />
          <TodoList />
        </div>
      </div>
    </main>
  );
}
