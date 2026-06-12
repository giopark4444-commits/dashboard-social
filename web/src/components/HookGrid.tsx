"use client";
import { useState } from "react";
import { DEMO_HOOKS } from "@/lib/demo-data";

export default function HookGrid() {
  const [tag, setTag] = useState<string | null>(null);
  const tags = [...new Set(DEMO_HOOKS.flatMap((h) => h.tags))].sort();
  const hooks = tag ? DEMO_HOOKS.filter((h) => h.tags.includes(tag)) : DEMO_HOOKS;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTag(null)}
          className={`text-xs rounded-full px-3 py-1 border ${tag === null ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
          todos
        </button>
        {tags.map((t) => (
          <button key={t} onClick={() => setTag(t)}
            className={`text-xs rounded-full px-3 py-1 border ${tag === t ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
            #{t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hooks.map((h) => (
          <div key={h.id} className="bg-surface border border-border rounded-xl p-4 hover:border-accent/40">
            <div className="flex items-start gap-3">
              <div className="text-2xl font-extrabold text-accent w-12 shrink-0">{h.score}</div>
              <div className="flex-1">
                <p className="text-sm text-bright leading-snug">"{h.text}"</p>
                <div className="flex gap-2 mt-2 items-center">
                  {h.tags.map((t) => (
                    <span key={t} className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5">#{t}</span>
                  ))}
                  <span className="text-[9px] text-dim ml-auto">{h.fuente}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
