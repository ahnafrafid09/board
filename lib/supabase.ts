import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Status = "todo" | "doing" | "done";

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  status: Status;
  position: number;
  created_at: string;
  completed_at: string | null;
  created_by: string;
  description: string;
  due_date: string | null;
  priority: Priority;
};

export const COLUMNS: { id: Status; label: string }[] = [
  { id: "todo", label: "Rencana" },
  { id: "doing", label: "Dikerjakan" },
  { id: "done", label: "Selesai" },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: "low", label: "Rendah", color: "#8A9AA8" },
  { id: "medium", label: "Sedang", color: "#D97706" },
  { id: "high", label: "Tinggi", color: "#C2410C" },
];
