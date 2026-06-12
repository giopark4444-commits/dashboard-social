"use client";
import { useState } from "react";

type Line = { who: "tú" | "jarvis"; text: string };
const DEMO_REPLY =
  "Sistemas visuales en línea. El cerebro (API de Claude) se conecta en la fase final — por ahora registro tu mensaje y me veo épico.";

export default function JarvisConsole() {
  const [lines, setLines] = useState<Line[]>([
    { who: "jarvis", text: "J.A.R.V.I.S. operativo. ¿En qué trabajamos hoy?" },
  ]);
  const [input, setInput] = useState("");

  function send() {
    const text = input.trim();
    if (!text) return;
    setLines((l) => [...l, { who: "tú", text }, { who: "jarvis", text: DEMO_REPLY }]);
    setInput("");
  }

  return (
    <div className="w-full max-w-xl">
      <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-1">
        {lines.slice(-6).map((l, i) => (
          <p key={i} className="text-sm">
            <span className={l.who === "jarvis" ? "text-accent" : "text-dim"}>{l.who === "jarvis" ? "◉ " : "▸ "}</span>
            <span className={l.who === "jarvis" ? "text-foreground" : "text-muted"}>{l.text}</span>
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Habla con J.A.R.V.I.S.…"
          className="flex-1 bg-surface/80 border border-accent/30 rounded-lg px-4 py-2 text-sm text-bright placeholder:text-dim backdrop-blur" />
        <button onClick={send} disabled={!input.trim()}
          className="bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 disabled:opacity-40">➤</button>
      </div>
    </div>
  );
}
