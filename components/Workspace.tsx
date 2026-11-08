"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Board from "./Board";

type BoardRow = { id: string; name: string; owner_id: string; invite_code: string };
type Member = { user_id: string; role: "owner" | "member" };

export default function Workspace({ email, userId }: { email: string; userId: string }) {
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({});
  const [share, setShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);

  const loadBoards = useCallback(async (preferId?: string) => {
    const { data, error } = await supabase.from("boards").select("*").order("created_at");
    if (error) return setError(error.message);
    let list = (data ?? []) as BoardRow[];
    if (list.length === 0 && !creating.current) {
      creating.current = true;
      const { data: nb } = await supabase.from("boards").insert({ name: "Board saya" }).select().single();
      if (nb) list = [nb as BoardRow];
    }
    setBoards(list);
    const wanted = preferId ?? localStorage.getItem("board");
    setCurrentId(list.find((b) => b.id === wanted)?.id ?? list[0]?.id ?? "");
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (!currentId) return;
    localStorage.setItem("board", currentId);
    (async () => {
      const [m, p] = await Promise.all([
        supabase.from("board_members").select("user_id, role").eq("board_id", currentId),
        supabase.from("profiles").select("id, email"),
      ]);
      setMembers((m.data ?? []) as Member[]);
      const map: Record<string, string> = {};
      (p.data ?? []).forEach((r: { id: string; email: string | null }) => {
        map[r.id] = (r.email ?? "?").split("@")[0];
      });
      setPeople(map);
    })();
  }, [currentId, share]);

  const board = boards.find((b) => b.id === currentId);
  const isOwner = board?.owner_id === userId;
  const link = board && typeof window !== "undefined" ? `${window.location.origin}/join/${board.invite_code}` : "";

  async function newBoard() {
    const name = window.prompt("Nama board baru")?.trim();
    if (!name) return;
    const { data, error } = await supabase.from("boards").insert({ name }).select().single();
    if (error) return setError(error.message);
    await loadBoards((data as BoardRow).id);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function regenerate() {
    if (!board || !window.confirm("Link lama akan berhenti berfungsi. Lanjut?")) return;
    const { error } = await supabase.rpc("regenerate_invite", { b: board.id });
    if (error) return setError(error.message);
    await loadBoards(board.id);
  }

  async function leaveOrDelete() {
    if (!board) return;
    const msg = isOwner ? `Hapus board "${board.name}" beserta semua task-nya untuk semua anggota?` : `Keluar dari board "${board.name}"?`;
    if (!window.confirm(msg)) return;
    const { error } = isOwner
      ? await supabase.from("boards").delete().eq("id", board.id)
      : await supabase.from("board_members").delete().eq("board_id", board.id).eq("user_id", userId);
    if (error) return setError(error.message);
    setShare(false);
    localStorage.removeItem("board");
    creating.current = false;
    await loadBoards();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            aria-label="Pilih board"
            className="text-xl font-bold bg-transparent border border-[#DCE3E8] rounded-md px-2 py-1"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button onClick={newBoard} className="px-3 py-1.5 rounded-md border border-[#DCE3E8] bg-white text-sm">
            Board baru
          </button>
          <button onClick={() => setShare(true)} className="px-3 py-1.5 rounded-md bg-[#0F766E] text-white text-sm font-semibold">
            Bagikan ({members.length})
          </button>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#5B6B7A]">{email}</p>
          <button onClick={() => supabase.auth.signOut()} className="text-sm underline">
            Keluar
          </button>
        </div>
      </header>
      {error && <p className="mt-3 text-sm text-[#B45309]">{error}</p>}

      {currentId && <Board key={currentId} boardId={currentId} people={people} />}

      {share && board && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={() => setShare(false)}>
          <div role="dialog" aria-label="Bagikan board" className="w-full max-w-md bg-white rounded-xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Bagikan "{board.name}"</h2>
            <p className="text-sm text-[#5B6B7A] mb-3">Siapa pun yang punya link ini dan login bisa bergabung dan mengubah task.</p>
            <div className="flex gap-2 mb-2">
              <input readOnly value={link} className="flex-1 px-3 py-2 rounded-md border border-[#DCE3E8] text-sm bg-[#F2F5F7]" />
              <button onClick={copyLink} className="px-3 py-2 rounded-md bg-[#0F766E] text-white text-sm font-semibold">
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
            {isOwner && (
              <button onClick={regenerate} className="text-sm underline text-[#5B6B7A] mb-4">
                Buat link baru (cabut link lama)
              </button>
            )}
            <h3 className="font-semibold mt-3 mb-2 text-sm">Anggota ({members.length})</h3>
            <ul className="mb-4 max-h-40 overflow-auto">
              {members.map((m) => (
                <li key={m.user_id} className="text-sm py-1 flex justify-between">
                  <span>{people[m.user_id] ?? "Anggota"}{m.user_id === userId ? " (kamu)" : ""}</span>
                  <span className="text-[#5B6B7A]">{m.role === "owner" ? "Pemilik" : "Anggota"}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center">
              <button onClick={leaveOrDelete} className="text-sm text-[#B45309] underline">
                {isOwner ? "Hapus board" : "Keluar dari board"}
              </button>
              <button onClick={() => setShare(false)} className="px-4 py-2 rounded-md border border-[#DCE3E8]">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
