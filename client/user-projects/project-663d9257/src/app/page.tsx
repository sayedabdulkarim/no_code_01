"use client";

import FilterTabs from "@/components/FilterTabs";
import TaskCounter from "@/components/TaskCounter";
import TodoInput from "@/components/TodoInput";
import TodoList from "@/components/TodoList";
import { TodoProvider } from "@/context/TodoContext";

export default function Home() {
  return (
    <TodoProvider>
      <main className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Todo App
          </h1>
          <h1>Hii</h1>
          <TodoInput />
          <div className="mt-6">
            <FilterTabs />
          </div>
          <TodoList />
          <div className="mt-4 border-t pt-4">
            <TaskCounter />
          </div>
        </div>
      </main>
    </TodoProvider>
  );
}
