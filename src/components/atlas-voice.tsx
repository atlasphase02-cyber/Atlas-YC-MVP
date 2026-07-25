import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Keyboard, X, Send, Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Atlas Voice — floating voice experience + landing section         */
/* ------------------------------------------------------------------ */

const OPEN_EVENT = "atlas:open-voice";

export function openAtlasVoice(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { prompt } }));
}

type Turn = {
  role: "user" | "atlas";
  text: string;
  streamed?: string;
  done?: boolean;
};

type Demo = { user: string; atlas: string };

const DEMOS: Demo[] = [
  {
    user: "Atlas, what's costing my company the most money?",
    atlas:
      "Based on your operational data, supplements are being delayed an average of 11 days. That's currently costing an estimated $186,000 in unrealized revenue. Would you like me to show you where the bottlenecks are?",
  },
  {
    user: "What should my team focus on today?",
    atlas:
      "I've identified three high-impact priorities that will have the biggest effect on revenue today.",
  },
];

const STATUS_CYCLE = [
  "Listening…",
  "Understanding…",
  "Connecting company knowledge…",
  "Atlas is responding…",
] as const;

/* ---------------- Section ---------------- */

export function TalkToYourBusiness() {
  return (
    <section
      id="voice"
      className="relative w-full px-6 py-24 md:px-10 md:py-36 lg:px-16 border-t border-white/5"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-atmosphere opacity-60" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-atlas-cyan-soft">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-atlas-cyan/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-atlas-cyan" />
              </span>
              Voice Intelligence
            </div>

            <h2 className="mt-6 font-display text-4xl leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              Talk to Your <span className="text-gradient-atlas">Business.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/70 md:text-xl">
              Your company already knows the answers. Atlas lets you ask
              naturally.
            </p>
            <p className="mt-4 max-w-xl text-base text-white/50">
              No dashboards. No searching. Just ask. Atlas understands your
              documents, conversations, jobs, claims, and workflows, then
              answers instantly.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => openAtlasVoice()}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-atlas-cyan px-6 py-3.5 text-sm font-medium tracking-wide text-[oklch(0.14_0.03_265)] transition hover:scale-[1.02] glow-cyan"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.14_0.03_265)]/20" />
                  <Mic className="relative h-4 w-4" />
                </span>
                Try the Voice Experience
              </button>
              <span className="text-xs uppercase tracking-[0.24em] text-white/40">
                Beta · English
              </span>
            </div>
          </div>

          {/* Preview card */}
          <button
            type="button"
            onClick={() => openAtlasVoice()}
            className="group relative w-full text-left"
          >
            <div className="panel-atlas relative overflow-hidden rounded-3xl p-8 transition group-hover:-translate-y-1">
              <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-atlas-cyan/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-atlas-violet/10 blur-3xl" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <span className="absolute inset-0 animate-pulse-glow rounded-full bg-atlas-cyan/20" />
                    <Mic className="relative h-4 w-4 text-atlas-cyan" />
                  </div>
                  <div>
                    <div className="text-sm text-white/90">Atlas Voice</div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                      Always listening for you
                    </div>
                  </div>
                </div>
                <StaticWave />
              </div>

              <div className="mt-8 space-y-4 font-mono text-[13px]">
                <div className="text-white/50">You</div>
                <div className="text-white/85">
                  "Atlas, what's costing my company the most money?"
                </div>
                <div className="mt-6 text-atlas-cyan-soft">Atlas</div>
                <div className="text-white/75">
                  Supplements are delayed an average of{" "}
                  <span className="text-white">11 days</span> — roughly{" "}
                  <span className="text-white">$186,000</span> in unrealized
                  revenue…
                </div>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-atlas-cyan">
                Tap to open <Sparkles className="h-3 w-3" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Waveform ---------------- */

function StaticWave() {
  const bars = 18;
  return (
    <div className="flex h-8 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-atlas-cyan/60"
          style={{
            height: `${20 + Math.abs(Math.sin(i * 0.9)) * 60}%`,
            opacity: 0.35 + Math.abs(Math.sin(i * 0.6)) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

function LiveWave({ active }: { active: boolean }) {
  const bars = 28;
  const seeds = useMemo(
    () => Array.from({ length: bars }).map(() => Math.random()),
    [],
  );
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 90);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div className="flex h-16 items-end justify-center gap-[3px]">
      {seeds.map((s, i) => {
        const phase = (tick + i) * 0.35;
        const amp = active
          ? 0.4 + Math.abs(Math.sin(phase + s * 6)) * 0.6
          : 0.15 + s * 0.1;
        return (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-atlas-cyan to-atlas-violet transition-[height,opacity] duration-150 ease-out"
            style={{
              height: `${amp * 100}%`,
              opacity: active ? 0.6 + amp * 0.4 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------------- Speech helpers ---------------- */

function pickAtlasVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = [
    "Google UK English Female",
    "Google US English",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Samantha",
    "Karen",
    "Serena",
  ];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) return v;
  }
  return (
    voices.find((v) => /en[-_]/i.test(v.lang) && /female|aria|jenny|samantha/i.test(v.name)) ??
    voices.find((v) => /en[-_]/i.test(v.lang)) ??
    voices[0]
  );
}

/* ---------------- Floating Voice Experience ---------------- */

export function VoiceExperience() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [status, setStatus] = useState<string>("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [demoIdx, setDemoIdx] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [micListening, setMicListening] = useState(false);
  const streamTimers = useRef<number[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Warm up voices list (some browsers load asynchronously).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const s = window.speechSynthesis;
    s.getVoices();
    const onChange = () => s.getVoices();
    s.addEventListener?.("voiceschanged", onChange);
    return () => s.removeEventListener?.("voiceschanged", onChange);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    return () =>
      window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const clearTimers = () => {
    streamTimers.current.forEach((t) => window.clearTimeout(t));
    streamTimers.current = [];
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setSpeaking(false);
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
    setMicListening(false);
  };

  useEffect(() => {
    return () => {
      clearTimers();
      stopSpeech();
      stopRecognition();
    };
  }, []);

  // Stop audio when panel closes.
  useEffect(() => {
    if (!open) {
      stopSpeech();
      stopRecognition();
    }
  }, [open]);

  const speakAtlas = (
    text: string,
    onWord?: (charIndex: number) => void,
    onDone?: () => void,
  ) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone?.();
      return false;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickAtlasVoice();
    if (voice) utter.voice = voice;
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onboundary = (e) => {
      if (e.name === "word" || e.charIndex != null) {
        onWord?.(e.charIndex ?? 0);
      }
    };
    utter.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
      onDone?.();
    };
    utter.onerror = () => {
      setSpeaking(false);
      utteranceRef.current = null;
      onDone?.();
    };
    utteranceRef.current = utter;
    synth.speak(utter);
    return true;
  };

  const runDemo = (userText: string, atlasText: string) => {
    clearTimers();
    stopSpeech();
    setTurns((prev) => [
      ...prev,
      { role: "user", text: userText, done: true },
    ]);

    const stages: { label: string; delay: number }[] = [
      { label: "Listening…", delay: 0 },
      { label: "Understanding…", delay: 700 },
      { label: "Connecting company knowledge…", delay: 1500 },
      { label: "Atlas is responding…", delay: 2400 },
    ];
    stages.forEach(({ label, delay }) => {
      const id = window.setTimeout(() => setStatus(label), delay);
      streamTimers.current.push(id);
    });

    const startAt = 2700;
    const words = atlasText.split(" ");

    const startId = window.setTimeout(() => {
      setTurns((prev) => [
        ...prev,
        { role: "atlas", text: atlasText, streamed: "", done: false },
      ]);

      const revealUpTo = (charIndex: number) => {
        setTurns((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last || last.role !== "atlas") return prev;
          const upto = atlasText.slice(0, Math.max(0, charIndex));
          // trim to last full word
          const trimmed = upto.replace(/\s+\S*$/, "");
          copy[copy.length - 1] = { ...last, streamed: trimmed };
          return copy;
        });
      };

      const finish = () => {
        setTurns((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last || last.role !== "atlas") return prev;
          copy[copy.length - 1] = { ...last, streamed: atlasText, done: true };
          return copy;
        });
        setStatus("");
      };

      const spoke = speakAtlas(
        atlasText,
        (charIndex) => revealUpTo(charIndex),
        finish,
      );

      if (!spoke) {
        // Fallback: paced word reveal when TTS unavailable.
        words.forEach((_, i) => {
          const id = window.setTimeout(() => {
            setTurns((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (!last || last.role !== "atlas") return prev;
              copy[copy.length - 1] = {
                ...last,
                streamed: words.slice(0, i + 1).join(" "),
                done: i === words.length - 1,
              };
              return copy;
            });
            if (i === words.length - 1) setStatus("");
          }, i * 95);
          streamTimers.current.push(id);
        });
      }
    }, startAt);
    streamTimers.current.push(startId);
  };

  const startMicRecognition = (): boolean => {
    if (typeof window === "undefined") return false;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return false;
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      recognitionRef.current = rec;
      setMicListening(true);
      setStatus("Listening…");
      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript?.trim();
        setMicListening(false);
        recognitionRef.current = null;
        if (transcript) {
          const match = DEMOS.find((d) =>
            transcript.toLowerCase().includes(d.user.toLowerCase().slice(0, 12)),
          );
          const atlas =
            match?.atlas ??
            "I'm pulling that from your company knowledge now. In the live product, Atlas answers from your real jobs, claims, documents, and conversations.";
          runDemo(transcript, atlas);
        } else {
          setStatus("");
        }
      };
      rec.onerror = () => {
        setMicListening(false);
        recognitionRef.current = null;
        setStatus("");
      };
      rec.onend = () => {
        setMicListening(false);
      };
      rec.start();
      return true;
    } catch {
      setMicListening(false);
      return false;
    }
  };

  const handleTapToSpeak = () => {
    if (micListening) {
      stopRecognition();
      setStatus("");
      return;
    }
    if (speaking || status) {
      stopSpeech();
      clearTimers();
      setStatus("");
      return;
    }
    // Try real mic first; fall back to scripted demo.
    const started = startMicRecognition();
    if (!started) {
      const demo = DEMOS[demoIdx % DEMOS.length];
      setDemoIdx((n) => n + 1);
      runDemo(demo.user, demo.atlas);
    }
  };

  const handleSendTyped = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = typedInput.trim();
    if (!text) return;
    setTypedInput("");
    const match = DEMOS.find(
      (d) => d.user.toLowerCase() === text.toLowerCase(),
    );
    const atlas =
      match?.atlas ??
      "I'm pulling that from your company knowledge now. In the live product, Atlas answers from your real jobs, claims, documents, and conversations.";
    runDemo(text, atlas);
  };

  const reset = () => {
    clearTimers();
    stopSpeech();
    stopRecognition();
    setTurns([]);
    setStatus("");
  };

  const listening =
    micListening ||
    status === "Listening…" ||
    status === "Understanding…";
  const waveActive = listening || speaking || !!status;
  const displayStatus = speaking && !status ? "Speaking…" : status;

  return (
    <>
      {/* Floating mic button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Atlas Voice"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-atlas-cyan/40 bg-atlas-navy/80 backdrop-blur-xl transition hover:scale-105 md:bottom-8 md:right-8 md:h-16 md:w-16"
        style={{
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--atlas-cyan) 30%, transparent), 0 20px 60px -15px color-mix(in oklab, var(--atlas-cyan) 55%, transparent)",
        }}
      >
        <span className="absolute inset-0 animate-pulse-glow rounded-full bg-atlas-cyan/15" />
        <span className="absolute -inset-1 rounded-full border border-atlas-cyan/20" />
        <Mic className="relative h-5 w-5 text-atlas-cyan md:h-6 md:w-6" />
        <span className="sr-only">Talk to Atlas</span>
      </button>

      {/* Panel */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-atlas-void/70 backdrop-blur-md"
          />
          <div className="relative w-full max-w-xl animate-reveal">
            <div className="panel-atlas relative overflow-hidden rounded-t-3xl sm:rounded-3xl">
              {/* atmospheric halos */}
              <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-atlas-cyan/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-atlas-violet/15 blur-3xl" />

              {/* header */}
              <div className="relative flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <span className="absolute inset-0 animate-pulse-glow rounded-full bg-atlas-cyan/25" />
                    <Mic className="relative h-4 w-4 text-atlas-cyan" />
                  </div>
                  <div>
                    <div className="text-sm text-white/95">Atlas Voice</div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                      Executive intelligence
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 p-1.5 text-white/60 transition hover:text-white"
                  aria-label="Close voice panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* transcript */}
              <div className="relative max-h-[42vh] min-h-[220px] overflow-y-auto px-6 py-6 mask-fade-b">
                {turns.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-atlas-cyan-soft">
                      Ready
                    </div>
                    <div className="max-w-sm text-lg text-white/80">
                      Ask Atlas anything about your business.
                    </div>
                    <div className="text-xs text-white/40">
                      Try: "What's costing my company the most money?"
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-5">
                    {turns.map((t, i) => (
                      <li
                        key={i}
                        className={
                          t.role === "user" ? "text-right" : "text-left"
                        }
                      >
                        <div
                          className={
                            "text-[10px] uppercase tracking-[0.24em] " +
                            (t.role === "user"
                              ? "text-white/40"
                              : "text-atlas-cyan-soft")
                          }
                        >
                          {t.role === "user" ? "You" : "Atlas"}
                        </div>
                        <div
                          className={
                            "mt-1.5 inline-block max-w-[92%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed " +
                            (t.role === "user"
                              ? "bg-white/8 text-white/90"
                              : "bg-gradient-to-br from-atlas-cyan/10 to-atlas-violet/10 text-white/90 border border-white/5")
                          }
                        >
                          {t.role === "atlas" ? (
                            <>
                              {t.streamed}
                              {!t.done ? (
                                <span className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-atlas-cyan align-middle" />
                              ) : null}
                            </>
                          ) : (
                            t.text
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* status + waveform */}
              <div className="relative border-t border-white/5 px-6 pb-2 pt-4">
                <LiveWave active={waveActive} />
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.24em]">
                  <span
                    className={
                      "inline-block h-1.5 w-1.5 rounded-full " +
                      (waveActive
                        ? "bg-atlas-cyan animate-pulse"
                        : "bg-white/20")
                    }
                  />
                  <span className="text-white/60">
                    {displayStatus || "Idle · Tap to Speak"}
                  </span>
                </div>
              </div>

              {/* controls */}
              <div className="relative border-t border-white/5 px-6 py-5">
                {mode === "voice" ? (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTapToSpeak}
                      className="group relative inline-flex items-center gap-3 rounded-full bg-atlas-cyan px-6 py-3 text-sm font-medium text-[oklch(0.14_0.03_265)] transition hover:scale-[1.02] glow-cyan"
                    >
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        {!waveActive ? (
                          <span className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.14_0.03_265)]/25" />
                        ) : null}
                        <Mic className="relative h-4 w-4" />
                      </span>
                      {micListening
                        ? "Stop Listening"
                        : speaking
                          ? "Stop"
                          : status
                            ? "Cancel"
                            : "Tap to Speak"}
                    </button>
                    <div className="flex items-center gap-4 text-[11px] text-white/50">
                      <button
                        type="button"
                        onClick={() => setMode("text")}
                        className="inline-flex items-center gap-1.5 uppercase tracking-[0.22em] text-white/60 transition hover:text-atlas-cyan"
                      >
                        <Keyboard className="h-3.5 w-3.5" /> Type instead
                      </button>
                      {turns.length > 0 ? (
                        <button
                          type="button"
                          onClick={reset}
                          className="uppercase tracking-[0.22em] text-white/40 transition hover:text-white/80"
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendTyped}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <input
                        autoFocus
                        value={typedInput}
                        onChange={(e) => setTypedInput(e.target.value)}
                        placeholder="Ask Atlas about your business…"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!typedInput.trim() || !!status}
                        className="rounded-full bg-atlas-cyan p-2 text-[oklch(0.14_0.03_265)] transition disabled:opacity-40"
                        aria-label="Send"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/50">
                      <button
                        type="button"
                        onClick={() => setMode("voice")}
                        className="inline-flex items-center gap-1.5 uppercase tracking-[0.22em] text-white/60 transition hover:text-atlas-cyan"
                      >
                        <Mic className="h-3.5 w-3.5" /> Tap to Speak
                      </button>
                      {turns.length > 0 ? (
                        <button
                          type="button"
                          onClick={reset}
                          className="uppercase tracking-[0.22em] text-white/40 transition hover:text-white/80"
                        >
                          Reset
                        </button>
                      ) : null}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
