"use client";

import { useState } from "react";
import { PRIORITIES, type Priority, type Task } from "@/lib/supabase";

type Patch = Pick<Task, "title" | "description" | "due_date" | "priority">;

export default function TaskModal({
  task,
  onSave,
  onDelete,
  onClose,
}: {
  task: Task;
  onSave: (patch: Patch) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [due, setDue] = useState(task.due_date ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);

  const field = "w-full px-3 py-2 rounded-md border border-[#DCE3E8] bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Detail task"
        className="w-full max-w-md bg-white rounded-xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="text-sm text-[#5B6B7A]">Judul</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mb-3 font-semibold`} />

        <label className="text-sm text-[#5B6B7A]">Catatan</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Detail, link, atau apa yang sudah dikerjakan"
          className={`${field} mb-3`}
        />

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-sm text-[#5B6B7A]">Tenggat</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
          </div>
          <div>
            <label className="text-sm text-[#5B6B7A]">Prioritas</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={field}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={onDelete} className="text-sm text-[#B45309] underline">
            Hapus task
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-md border border-[#DCE3E8]">
              Batal
            </button>
            <button
              disabled={!title.trim()}
              onClick={() => onSave({ title: title.trim(), description, due_date: due || null, priority })}
              className="px-4 py-2 rounded-md bg-[#0F766E] text-white font-semibold disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
