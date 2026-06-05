"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Credenciales incorrectas");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-8 w-80 space-y-4">
        <h1 className="text-xl font-bold text-stone-800">Dashboard Social</h1>
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2" />
        <input type="password" required placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading}
          className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
