"use client";
import { useState } from "react";
import { DEMO_INBOX } from "@/lib/demo-data";

const CANAL_ICON: Record<string, string> = { IG: "◎", YT: "▶", WA: "✆" };

export default function InboxList() {
  const [canal, setCanal] = useState<string | null>(null);
  const canales = ["IG", "YT", "WA"];
  const items = canal ? DEMO_INBOX.filter((i) => i.canal === canal) : DEMO_INBOX;
  const pendientes = DEMO_INBOX.filter((i) => i.estado === "pendiente").length;

  return (
    <>
      <div className="flex gap-2 mb-4 items-center">
        <button onClick={() => setCanal(null)}
          className={`text-xs rounded-full px-3 py-1 border ${canal === null ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
          todos
        </button>
        {canales.map((c) => (
          <button key={c} onClick={() => setCanal(c)}
            className={`text-xs rounded-full px-3 py-1 border ${canal === c ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
            {CANAL_ICON[c]} {c}
          </button>
        ))}
        <span className="ml-auto text-xs text-warn">{pendientes} pendientes</span>
      </div>

      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className={`bg-surface border rounded-xl p-4 ${m.estado === "pendiente" ? "border-border" : "border-border/40 opacity-60"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-accent">{CANAL_ICON[m.canal]}</span>
              <span className="text-sm font-bold text-bright">{m.de}</span>
              <span className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5 uppercase">{m.tipo}</span>
              <span className="text-[10px] text-dim ml-auto">{m.hace}</span>
            </div>
            <p className="text-sm text-foreground mb-2">{m.texto}</p>
            <div className="bg-surface-2 border border-accent/20 rounded-lg p-3">
              <p className="text-[9px] tracking-widest text-accent mb-1">◉ RESPUESTA SUGERIDA (IA EN FASE FINAL)</p>
              <p className="text-xs text-muted">{m.sugerencia}</p>
              {m.estado === "pendiente" && (
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-accent/20 border border-accent/50 text-bright rounded px-3 py-1">Aprobar y enviar</button>
                  <button className="text-xs border border-border text-dim rounded px-3 py-1">Editar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
