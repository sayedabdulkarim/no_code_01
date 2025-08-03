export type MessageCategory =
  | "requirement"
  | "analysis"
  | "plan"
  | "feedback"
  | "prd"
  | "error"
  | "success"
  | "status"
  | "info";

export interface Task {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  details?: string;
}

export interface Message {
  id?: string;
  type: "user" | "agent" | "status" | "tasks";
  content: string;
  category?: MessageCategory;
  statusType?: "processing" | "success" | "error" | "info";
  icon?: string;
  tasks?: Task[];
}
