"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import JarvisOrb from "@/components/JarvisOrb";

type Line = { who: "tú" | "jarvis"; text: string };

const DEMO_REPLIES = [
  "Sistemas visuales en línea. El cerebro (API de Claude) se conecta en la fase final — registro tu mensaje.",
  "Anotado. Cuando me conecten el cerebro podré analizar tus métricas de verdad.",
  "Te escucho perfectamente. Razonar todavía no me toca — eso llega en la fase de APIs.",
];

// Tipos mínimos de Web Speech (no están completos en lib.dom)
type SRResult = { 0: { transcript: string }; isFinal: boolean };
type SREvent = { results: { length: number; [i: number]: SRResult }; resultIndex: number };
type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechRecCtor = new () => SpeechRec;

function getSpeechRecCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function JarvisStage({ left, right }: { left: ReactNode; right: ReactNode }) {
  const levelRef = useRef<number>(0);
  const [lines, setLines] = useState<Line[]>([
    { who: "jarvis", text: "J.A.R.V.I.S. operativo. Escríbeme o tócame el micrófono." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // useSyncExternalStore: false en SSR, valor real tras hidratar — sin mismatch
  const micSupported = useSyncExternalStore(
    () => () => {},
    () => getSpeechRecCtor() !== null,
    () => false
  );
  const replyIdx = useRef(0);
  const recRef = useRef<SpeechRec | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);

  useEffect(() => {
    return () => stopMicAnalysis();
  }, []);

  function blip(freq: number) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
      osc.onended = () => ctx.close();
    } catch { /* sin audio, sin drama */ }
  }

  async function startMicAnalysis() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    function loop() {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      levelRef.current = Math.min(1, (sum / data.length / 255) * 2.2);
      const raf = requestAnimationFrame(loop);
      if (audioRef.current) audioRef.current.raf = raf;
    }
    audioRef.current = { ctx, stream, raf: requestAnimationFrame(loop) };
  }

  function stopMicAnalysis() {
    const a = audioRef.current;
    if (!a) return;
    cancelAnimationFrame(a.raf);
    a.stream.getTracks().forEach((t) => t.stop());
    a.ctx.close().catch(() => {});
    audioRef.current = null;
    levelRef.current = 0;
  }

  function speak(text: string) {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voz = speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
    if (voz) u.voice = voz;
    u.rate = 1.05;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    speechSynthesis.speak(u);
  }

  // mientras Jarvis habla, el orbe vibra con onda sintética
  useEffect(() => {
    if (!speaking) return;
    let raf = 0;
    const t0 = performance.now();
    function wave(now: number) {
      const t = (now - t0) / 1000;
      levelRef.current = 0.35 + Math.abs(Math.sin(t * 7)) * 0.3 + Math.random() * 0.08;
      raf = requestAnimationFrame(wave);
    }
    raf = requestAnimationFrame(wave);
    return () => {
      cancelAnimationFrame(raf);
      if (!audioRef.current) levelRef.current = 0;
    };
  }, [speaking]);

  function handleUser(text: string) {
    const reply = DEMO_REPLIES[replyIdx.current % DEMO_REPLIES.length];
    replyIdx.current += 1;
    setLines((l) => [...l, { who: "tú", text }, { who: "jarvis", text: reply }]);
    speak(reply);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    blip(880);
    setInput("");
    handleUser(text);
  }

  async function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecCtor();
    if (!Ctor) return;
    try {
      await startMicAnalysis();
    } catch {
      return; // permiso de mic denegado
    }
    const rec = new Ctor();
    rec.lang = "es-CO";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (transcript) handleUser(transcript);
    };
    rec.onerror = () => {};
    rec.onend = () => {
      setListening(false);
      stopMicAnalysis();
    };
    recRef.current = rec;
    setListening(true);
    blip(660);
    rec.start();
  }

  return (
    <>
      <div className="flex items-center gap-10 z-10">
        <div className="hidden md:flex flex-col gap-3">{left}</div>
        <JarvisOrb size={300} levelRef={levelRef} />
        <div className="hidden md:flex flex-col gap-3">{right}</div>
      </div>

      <div className="mt-8 z-10 w-full flex justify-center px-6">
        <div className="w-full max-w-xl">
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-1">
            {lines.slice(-6).map((l, i) => (
              <p key={i} className="text-sm">
                <span className={l.who === "jarvis" ? "text-accent" : "text-dim"}>{l.who === "jarvis" ? "◉ " : "▸ "}</span>
                <span className={l.who === "jarvis" ? "text-foreground" : "text-muted"}>{l.text}</span>
              </p>
            ))}
            {listening && <p className="text-sm text-accent animate-pulse">◉ escuchando…</p>}
          </div>
          <div className="flex gap-2">
            {micSupported && (
              <button onClick={toggleMic} title={listening ? "Dejar de escuchar" : "Hablar con Jarvis"}
                className={`w-11 rounded-lg border text-lg ${listening ? "border-red-400 text-red-400 animate-pulse" : "border-accent/40 text-accent hover:border-accent"}`}>
                {listening ? "■" : "🎙"}
              </button>
            )}
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={micSupported ? "Habla o escribe…" : "Escríbele a J.A.R.V.I.S.…"}
              className="flex-1 bg-surface/80 border border-accent/30 rounded-lg px-4 py-2 text-sm text-bright placeholder:text-dim backdrop-blur" />
            <button onClick={send} disabled={!input.trim()}
              className="bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 disabled:opacity-40">➤</button>
          </div>
        </div>
      </div>
    </>
  );
}
