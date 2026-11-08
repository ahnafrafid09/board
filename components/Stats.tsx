import type { Task } from "@/lib/supabase";

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Stats({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // selesai per hari, 7 hari terakhir
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const counts = days.map(
    (d) => tasks.filter((t) => t.completed_at && dayKey(new Date(t.completed_at)) === dayKey(d)).length
  );
  const max = Math.max(1, ...counts);
  const today = counts[6];

  return (
    <section className="grid gap-4 md:grid-cols-2 mb-6">
      <div className="bg-white rounded-xl p-5 border border-[#DCE3E8]">
        <p className="text-sm text-[#5B6B7A]">Hari ini kamu menyelesaikan</p>
        <p className="text-3xl font-bold mt-1">{today} task</p>
        <div className="mt-4 h-2 rounded-full bg-[#E4EAEE] overflow-hidden">
          <div className="h-full bg-[#0F766E] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-[#5B6B7A] mt-2">
          {done} dari {total} task selesai ({pct}%)
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 border border-[#DCE3E8]">
        <p className="text-sm text-[#5B6B7A] mb-3">Task selesai, 7 hari terakhir</p>
        <div className="flex items-end gap-2 h-20">
          {counts.map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs mb-1">{c}</span>
              <div
                className={`w-full rounded-t ${i === 6 ? "bg-[#0F766E]" : "bg-[#9DB8B5]"}`}
                style={{ height: `${(c / max) * 100}%`, minHeight: c ? 4 : 2 }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          {days.map((d, i) => (
            <span key={i} className="flex-1 text-center text-xs text-[#5B6B7A]">
              {d.toLocaleDateString("id-ID", { weekday: "short" })}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
