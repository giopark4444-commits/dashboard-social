"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    await fetch("/api/refresh", { method: "POST" });
    router.refresh();
    setBusy(false);
  }
  return (
    <button onClick={refresh} disabled={busy}
      className="text-sm bg-emerald-700 text-white rounded-lg px-4 py-1.5 disabled:opacity-50">
      {busy ? "Actualizando…" : "● Actualizar datos"}
    </button>
  );
}
