"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg("");
    const { error } =
      mode === "masuk"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else if (mode === "daftar") setMsg("Akun dibuat. Cek email untuk konfirmasi jika diminta, lalu masuk.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-sm border border-[#DCE3E8]">
        <h1 className="text-2xl font-bold">Progress Harian</h1>
        <p className="text-sm text-[#5B6B7A] mt-1 mb-5">
          {mode === "masuk" ? "Masuk untuk melihat board kamu." : "Buat akun untuk mulai mencatat progress."}
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-md border border-[#DCE3E8]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full mb-4 px-3 py-2 rounded-md border border-[#DCE3E8]"
        />
        <button
          onClick={submit}
          disabled={loading || !email || !password}
          className="w-full py-2 rounded-md bg-[#0F766E] text-white font-semibold disabled:opacity-50"
        >
          {mode === "masuk" ? "Masuk" : "Daftar"}
        </button>
        {msg && <p className="text-sm mt-3 text-[#B45309]">{msg}</p>}
        <button
          onClick={() => setMode(mode === "masuk" ? "daftar" : "masuk")}
          className="text-sm mt-4 text-[#5B6B7A] underline"
        >
          {mode === "masuk" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </main>
  );
}
