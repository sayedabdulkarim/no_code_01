export interface Todo {
  id: string;
  description: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface TodoContextType {
  todos: Todo[];
  addTodo: (description: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  totalTodos: number;
  completedTodos: number;
}
