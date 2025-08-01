export type MessageCategory =
  | "requirement"
  | "analysis"
  | "plan"
  | "feedback"
  | "prd"
  | "error"
  | "success"
  | "status";

export interface Message {
  type: "user" | "agent" | "status";
  content: string;
  category?: MessageCategory;
  statusType?: "processing" | "success" | "error" | "info";
  icon?: string;
}
