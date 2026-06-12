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
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={onSubmit}
        className="bg-surface border border-border rounded-2xl p-8 w-80 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-bright tracking-widest">VANTAGE STUDIO</h1>
          <p className="text-xs text-dim tracking-widest">COMMAND CENTER</p>
        </div>
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-dim" />
        <input type="password" required placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-dim" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading}
          className="w-full bg-accent/20 border border-accent/50 text-bright rounded-lg py-2 hover:bg-accent/30 disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
