"use client";

import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { supabase, COLUMNS, PRIORITIES, type Priority, type Status, type Task } from "@/lib/supabase";
import Stats from "./Stats";
import TaskModal from "./TaskModal";

const STRIPE: Record<Status, string> = {
  todo: "border-l-[#8A9AA8]",
  doing: "border-l-[#D97706]",
  done: "border-l-[#0F766E]",
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function DueBadge({ task }: { task: Task }) {
  if (!task.due_date) return null;
  const t = todayStr();
  const overdue = task.status !== "done" && task.due_date < t;
  const isToday = task.status !== "done" && task.due_date === t;
  const label = new Date(task.due_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const cls = overdue
    ? "bg-[#FDE8E3] text-[#B42318]"
    : isToday
    ? "bg-[#FEF3C7] text-[#92400E]"
    : "bg-[#EEF2F5] text-[#5B6B7A]";
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>
      {overdue ? "Terlambat, " : isToday ? "Hari ini, " : ""}
      {label}
    </span>
  );
}

export default function Board({ boardId, people }: { boardId: string; people: Record<string, string> }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("tasks").select("*").eq("board_id", boardId).order("position");
    if (error) setError(error.message);
    else setTasks((data ?? []) as Task[]);
  }, [boardId]);

  useEffect(() => {
    load();
    // realtime: kalau anggota lain mengubah task, board ikut diperbarui
    const ch = supabase
      .channel(`tasks-${boardId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `board_id=eq.${boardId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [boardId, load]);

  const byStatus = (s: Status) => tasks.filter((t) => t.status === s).sort((a, b) => a.position - b.position);

  async function addTask() {
    const t = title.trim();
    if (!t) return;
    const last = byStatus("todo").at(-1);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ board_id: boardId, title: t, status: "todo", position: (last?.position ?? 0) + 1000, due_date: due || null, priority })
      .select()
      .single();
    if (error) return setError(error.message);
    setTasks((prev) => [...prev, data as Task]);
    setTitle("");
    setDue("");
    setPriority("medium");
  }

  async function saveTask(id: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setEditing(null);
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) {
      setError(error.message);
      load();
    }
  }

  async function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditing(null);
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setError(error.message);
      load();
    }
  }

  async function onDragEnd(r: DropResult) {
    const { destination, source, draggableId } = r;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const dest = destination.droppableId as Status;
    const task = tasks.find((t) => t.id === draggableId)!;
    const list = byStatus(dest).filter((t) => t.id !== draggableId);
    const prev = list[destination.index - 1];
    const next = list[destination.index];
    const position =
      prev && next ? (prev.position + next.position) / 2 : prev ? prev.position + 1000 : next ? next.position - 1000 : 1000;
    const completed_at =
      dest === "done" ? (task.status === "done" ? task.completed_at : new Date().toISOString()) : null;

    setTasks((all) => all.map((t) => (t.id === draggableId ? { ...t, status: dest, position, completed_at } : t)));
    const { error } = await supabase.from("tasks").update({ status: dest, position, completed_at }).eq("id", draggableId);
    if (error) {
      setError(error.message);
      load();
    }
  }

  const input = "px-3 py-2 rounded-md border border-[#DCE3E8] bg-white";

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8">

      <Stats tasks={tasks} />

      <div className="flex flex-wrap gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Tulis task baru"
          className={`${input} flex-1 min-w-48`}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Tenggat" className={input} />
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Prioritas" className={input}>
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button onClick={addTask} className="px-4 py-2 rounded-md bg-[#0F766E] text-white font-semibold">
          Tambah task
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-[#B45309]">{error}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(prov, snap) => (
                <section
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  className={`rounded-xl p-3 min-h-48 border ${
                    snap.isDraggingOver ? "bg-[#E3EEEC] border-[#0F766E]" : "bg-[#E8EDF1] border-transparent"
                  }`}
                >
                  <h2 className="font-semibold mb-3 px-1">
                    {col.label} <span className="text-[#5B6B7A] font-normal">({byStatus(col.id).length})</span>
                  </h2>
                  {byStatus(col.id).map((t, i) => (
                    <Draggable draggableId={t.id} index={i} key={t.id}>
                      {(p, s) => (
                        <article
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          onClick={() => setEditing(t)}
                          className={`mb-2 bg-white rounded-md border border-[#DCE3E8] border-l-4 ${STRIPE[t.status]} px-3 py-2 cursor-pointer ${
                            s.isDragging ? "shadow-lg" : ""
                          }`}
                        >
                          <p className={`text-sm ${t.status === "done" ? "line-through text-[#5B6B7A]" : ""}`}>{t.title}</p>
                          {t.description && (
                            <p className="text-xs text-[#5B6B7A] mt-1 line-clamp-2">{t.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              title={`Prioritas ${PRIORITIES.find((x) => x.id === t.priority)?.label}`}
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: PRIORITIES.find((x) => x.id === t.priority)?.color }}
                            />
                            <DueBadge task={t} />
                            <span
                              title={people[t.created_by] ?? ""}
                              className="ml-auto w-5 h-5 rounded-full bg-[#CFE3E0] text-[#0F5F58] text-[10px] font-semibold grid place-items-center"
                            >
                              {(people[t.created_by] ?? "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </article>
                      )}
                    </Draggable>
                  ))}
                  {prov.placeholder}
                  {byStatus(col.id).length === 0 && (
                    <p className="text-sm text-[#5B6B7A] px-1">Belum ada task. Seret ke sini.</p>
                  )}
                </section>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {editing && (
        <TaskModal
          key={editing.id}
          task={editing}
          onSave={(patch) => saveTask(editing.id, patch)}
          onDelete={() => removeTask(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
