"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Auth from "@/components/Auth";

export default function JoinClient({ code }: { code: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.rpc("join_board", { code }).then(({ data, error }) => {
      if (error) return setError(error.message);
      localStorage.setItem("board", data as string);
      router.replace("/");
    });
  }, [session, code, router]);

  if (!ready) return null;
  if (!session) return <Auth />;
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <p className={error ? "text-[#B45309]" : "text-[#5B6B7A]"}>{error || "Menggabungkan kamu ke board..."}</p>
    </main>
  );
}
