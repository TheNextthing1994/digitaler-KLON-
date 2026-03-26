export type Persona = "visionary" | "executive";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  persona?: Persona;
  timestamp: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
}

export interface YTAnalysis {
  type: "education" | "project";
  content: string;
  summary: string;
}
