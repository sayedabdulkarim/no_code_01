export type MessageCategory =
  | "requirement"
  | "analysis"
  | "plan"
  | "feedback"
  | "prd"
  | "error"
  | "success";

export interface Message {
  type: "user" | "agent";
  content: string;
  category?: MessageCategory;
}
