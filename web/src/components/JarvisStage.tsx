"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import JarvisOrb from "@/components/JarvisOrb";
import { extractCommand } from "@/lib/jarvis-wake";

type Line = { who: "tú" | "jarvis"; text: string };
type Lang = "es" | "en" | "fr";

const LANGS: Record<Lang, {
  label: string;
  rec: string;
  greet: string;
  wakeAck: string;
  heard: string;
  hint: string;
  online: string;
  offline: string;
  replies: string[];
}> = {
  es: {
    label: "ES", rec: "es-CO",
    greet: "J.A.R.V.I.S. operativo. Activa la escucha y di «Jarvis» seguido de tu orden.",
    wakeAck: "¿Sí? Te escucho.",
    heard: "escuché",
    hint: "Di «Jarvis» + tu orden, o escribe…",
    online: "escucha continua activa — di «Jarvis» para hablarme",
    offline: "escucha desactivada",
    replies: [
      "Orden registrada. El cerebro con la API de Claude se conecta en la fase final — por ahora tomo nota.",
      "Entendido. Cuando me conecten el cerebro podré ejecutar eso de verdad.",
      "Anotado en la bitácora. Razonar llega en la fase de APIs.",
    ],
  },
  en: {
    label: "EN", rec: "en-US",
    greet: "J.A.R.V.I.S. online. Enable listening and say 'Jarvis' followed by your command.",
    wakeAck: "Yes? I am listening.",
    heard: "heard",
    hint: "Say 'Jarvis' + your command, or type…",
    online: "continuous listening on — say 'Jarvis' to talk to me",
    offline: "listening off",
    replies: [
      "Command logged. My brain — the Claude API — comes online in the final phase.",
      "Understood. Once my brain is connected I will actually execute that.",
      "Noted. Reasoning arrives in the API phase.",
    ],
  },
  fr: {
    label: "FR", rec: "fr-FR",
    greet: "J.A.R.V.I.S. opérationnel. Activez l'écoute et dites « Jarvis » suivi de votre ordre.",
    wakeAck: "Oui ? Je vous écoute.",
    heard: "entendu",
    hint: "Dites « Jarvis » + votre ordre, ou écrivez…",
    online: "écoute continue activée — dites « Jarvis » pour me parler",
    offline: "écoute désactivée",
    replies: [
      "Ordre enregistré. Mon cerveau — l'API Claude — sera connecté dans la phase finale.",
      "Compris. Une fois mon cerveau connecté, je pourrai vraiment l'exécuter.",
      "C'est noté. Le raisonnement arrive dans la phase des API.",
    ],
  },
};

// Tipos mínimos de Web Speech (no están completos en lib.dom)
type SRAlt = { transcript: string };
type SRResult = { 0: SRAlt; isFinal: boolean };
type SREvent = { results: { length: number; [i: number]: SRResult }; resultIndex: number };
type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
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
  const [lang, setLang] = useState<Lang>("es");
  const [lines, setLines] = useState<Line[]>([{ who: "jarvis", text: LANGS.es.greet }]);
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const micSupported = useSyncExternalStore(
    () => () => {},
    () => getSpeechRecCtor() !== null,
    () => false
  );

  const replyIdx = useRef(0);
  const recRef = useRef<SpeechRec | null>(null);
  const micActiveRef = useRef(false);
  const speakingRef = useRef(false);
  const langRef = useRef<Lang>("es");
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);

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
    if (audioRef.current) return;
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
      if (!speakingRef.current) levelRef.current = Math.min(1, (sum / data.length / 255) * 2.2);
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

  /** Arranca (o re-arranca) el reconocimiento continuo en el idioma actual. */
  function startRecognition() {
    const Ctor = getSpeechRecCtor();
    if (!Ctor || !micActiveRef.current) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = LANGS[langRef.current].rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (!text) continue;
        if (r.isFinal) {
          setInterim("");
          const command = extractCommand(text);
          if (command !== null) {
            handleUser(command);
            return;
          }
          setLastHeard(text);
        } else {
          interimText = text;
        }
      }
      setInterim(interimText);
    };
    rec.onerror = () => {};
    rec.onend = () => {
      // el navegador corta solo tras silencios: re-arrancar mientras la escucha siga activa
      if (micActiveRef.current && !speakingRef.current) {
        setTimeout(() => {
          if (micActiveRef.current && !speakingRef.current) {
            try { startRecognition(); } catch { /* reintento en el próximo onend */ }
          }
        }, 150);
      }
    };
    recRef.current = rec;
    try { rec.start(); } catch { /* ya estaba corriendo */ }
  }

  function speak(text: string) {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const prefix = langRef.current;
    const voz = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (voz) u.voice = voz;
    u.lang = LANGS[prefix].rec;
    u.rate = 1.05;
    u.onstart = () => {
      speakingRef.current = true;
      // pausa el reconocimiento para no escucharse a sí mismo
      recRef.current?.abort();
      setSpeakingTick((t) => t + 1);
    };
    u.onend = () => {
      speakingRef.current = false;
      setSpeakingTick((t) => t + 1);
      if (micActiveRef.current) startRecognition();
    };
    speechSynthesis.speak(u);
  }

  // tick para re-disparar la onda sintética del orbe mientras habla
  const [speakingTick, setSpeakingTick] = useState(0);
  useEffect(() => {
    if (!speakingRef.current) return;
    let raf = 0;
    const t0 = performance.now();
    function wave(now: number) {
      if (!speakingRef.current) return;
      const t = (now - t0) / 1000;
      levelRef.current = 0.35 + Math.abs(Math.sin(t * 7)) * 0.3 + Math.random() * 0.08;
      raf = requestAnimationFrame(wave);
    }
    raf = requestAnimationFrame(wave);
    return () => {
      cancelAnimationFrame(raf);
      if (!audioRef.current) levelRef.current = 0;
    };
  }, [speakingTick]);

  function handleUser(text: string) {
    const L = LANGS[langRef.current];
    const clean = text.trim();
    const reply = clean
      ? L.replies[replyIdx.current++ % L.replies.length]
      : L.wakeAck; // dijo solo «Jarvis»
    setLines((l) => [...l, ...(clean ? [{ who: "tú" as const, text: clean }] : []), { who: "jarvis" as const, text: reply }]);
    setLastHeard("");
    blip(880);
    speak(reply);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    handleUser(text);
  }

  async function toggleListening() {
    if (micActive) {
      micActiveRef.current = false;
      setMicActive(false);
      recRef.current?.abort();
      stopMicAnalysis();
      setInterim("");
      return;
    }
    try {
      await startMicAnalysis();
    } catch {
      return; // permiso de mic denegado
    }
    micActiveRef.current = true;
    setMicActive(true);
    blip(660);
    startRecognition();
  }

  function switchLang(next: Lang) {
    langRef.current = next;
    setLang(next);
    setLines((l) => [...l, { who: "jarvis", text: LANGS[next].greet }]);
    if (micActiveRef.current && !speakingRef.current) startRecognition();
  }

  // apagar todo al salir del HUD
  useEffect(() => {
    return () => {
      micActiveRef.current = false;
      recRef.current?.abort();
      stopMicAnalysis();
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    };
  }, []);

  const L = LANGS[lang];

  return (
    <>
      <div className="flex items-center gap-10 z-10">
        <div className="hidden md:flex flex-col gap-3">{left}</div>
        <JarvisOrb size={300} levelRef={levelRef} />
        <div className="hidden md:flex flex-col gap-3">{right}</div>
      </div>

      <div className="mt-8 z-10 w-full flex justify-center px-6">
        <div className="w-full max-w-xl">
          {/* estado de escucha + idiomas */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className={`text-[10px] tracking-widest ${micActive ? "text-ok" : "text-dim"}`}>
              {micActive ? "●" : "○"} {micActive ? L.online.toUpperCase() : L.offline.toUpperCase()}
            </span>
            <div className="ml-auto flex gap-1">
              {(Object.keys(LANGS) as Lang[]).map((k) => (
                <button key={k} onClick={() => switchLang(k)}
                  className={`text-[10px] rounded px-2 py-0.5 border tracking-widest ${lang === k ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
                  {LANGS[k].label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 mb-2 px-1">
            {lines.slice(-6).map((l, i) => (
              <p key={i} className="text-sm">
                <span className={l.who === "jarvis" ? "text-accent" : "text-dim"}>{l.who === "jarvis" ? "◉ " : "▸ "}</span>
                <span className={l.who === "jarvis" ? "text-foreground" : "text-muted"}>{l.text}</span>
              </p>
            ))}
            {interim && <p className="text-sm text-dim italic">▸ {interim}…</p>}
            {!interim && lastHeard && (
              <p className="text-[11px] text-dim">♪ {L.heard}: «{lastHeard}» — {lang === "es" ? "di «Jarvis» para que responda" : lang === "en" ? "say 'Jarvis' so I respond" : "dites « Jarvis » pour que je réponde"}</p>
            )}
          </div>

          <div className="flex gap-2">
            {micSupported && (
              <button onClick={toggleListening}
                title={micActive ? L.offline : L.online}
                className={`w-11 rounded-lg border text-lg ${micActive ? "border-ok text-ok" : "border-accent/40 text-accent hover:border-accent"}`}>
                {micActive ? "◉" : "🎙"}
              </button>
            )}
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={L.hint}
              className="flex-1 bg-surface/80 border border-accent/30 rounded-lg px-4 py-2 text-sm text-bright placeholder:text-dim backdrop-blur" />
            <button onClick={send} disabled={!input.trim()}
              className="bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 disabled:opacity-40">➤</button>
          </div>
        </div>
      </div>
    </>
  );
}
