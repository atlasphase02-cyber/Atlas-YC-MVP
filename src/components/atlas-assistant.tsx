import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Mic,
  MicOff,
  Send,
  X,
  Loader2,
  Volume2,
  VolumeX,
  Plus,
  MessageSquare,
  PanelLeft,
  Settings2,
  Pin,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { db, currentUserId, type Conversation, type ChatMessage } from "@/lib/atlas-db.ts";
import { useVoicePreferences } from "@/hooks/use-voice-preferences.ts";
import { Slider } from "@/components/ui/slider.tsx";
import { semanticSearch } from "@/lib/semantic-search.functions.ts";

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickVoice(preferredName?: string | null): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  if (preferredName) {
    const match = voices.find((v) => v.name === preferredName);
    if (match) return match;
  }
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  return (
    en.find((v) => /natural|neural|premium|studio/i.test(v.name)) ??
    en.find((v) => /female|samantha|aria|jenny|zira/i.test(v.name)) ??
    en[0] ??
    null
  );
}

const SUGGESTIONS = [
  "What should I focus on this morning?",
  "Show me revenue at risk",
  "Which claims are waiting on carriers?",
  "Draft a supplement follow-up",
];

type Panel = "chat" | "history" | "settings";

function toUIMessages(rows: ChatMessage[]): UIMessage[] {
  return rows.map((r) => ({
    id: r.id,
    role: r.role === "system" ? "system" : r.role,
    parts: [{ type: "text", text: r.content }],
  })) as UIMessage[];
}

function extractText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

export function AtlasAssistant() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("chat");
  const [convId, setConvId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const location = useLocation();
  const qc = useQueryClient();
  const { prefs, update: updatePrefs } = useVoicePreferences();
  const spokenRef = useRef(new Set<string>());
  const availableVoices = useAvailableVoices(open);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<Conversation[]> => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await db
        .from("conversations")
        .select("*")
        .is("archived_at", null)
        .order("pinned", { ascending: false })
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as Conversation[]) ?? [];
    },
    enabled: open,
  });

  async function ensureConversation(): Promise<string> {
    if (convId) return convId;
    const uid = await currentUserId();
    if (!uid) throw new Error("Not signed in");
    const { data, error } = await db
      .from("conversations")
      .insert({ owner_id: uid, page_context: { route: location.pathname } })
      .select("id")
      .single();
    if (error) throw error;
    const id = (data as { id: string }).id;
    setConvId(id);
    qc.invalidateQueries({ queryKey: ["conversations"] });
    return id;
  }

  async function persistMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    parts?: unknown,
  ) {
    const uid = await currentUserId();
    if (!uid) return;
    await db.from("messages").insert({
      owner_id: uid,
      conversation_id: conversationId,
      role,
      content,
      parts: parts ?? null,
    });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  const context = useMemo(
    () => `Route: ${location.pathname}. UI time: ${new Date().toISOString()}.`,
    [location.pathname],
  );

  const runSemantic = useServerFn(semanticSearch);
  const semanticRef = useRef<string>("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            context,
            systemExtra: semanticRef.current || undefined,
          },
        }),
      }),
    [context],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: convId ?? `pending-${chatKey}`,
    messages: initialMessages,
    transport,
    onFinish: async ({ message }) => {
      if (!convId) return;
      const text = extractText(message as UIMessage);
      if (text) await persistMessage(convId, "assistant", text, (message as UIMessage).parts);
    },
    onError: (err) => console.error("Atlas chat error:", err),
  });

  // Load conversation messages when switching
  async function switchTo(id: string | null) {
    setPanel("chat");
    if (id === null) {
      setConvId(null);
      setInitialMessages([]);
      setChatKey((k) => k + 1);
      spokenRef.current = new Set();
      return;
    }
    const { data, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    const rows = (data as ChatMessage[]) ?? [];
    setInitialMessages(toUIMessages(rows));
    setConvId(id);
    setChatKey((k) => k + 1);
    spokenRef.current = new Set(rows.filter((r) => r.role === "assistant").map((r) => r.id));
  }

  // TTS
  useEffect(() => {
    if (prefs.muted || status === "streaming") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (spokenRef.current.has(last.id)) return;
    const text = extractText(last);
    if (!text) return;
    spokenRef.current.add(last.id);
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice(prefs.voice_name);
      if (v) u.voice = v;
      u.rate = Number(prefs.rate) || 1;
      u.pitch = Number(prefs.pitch) || 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }, [messages, status, prefs.muted, prefs.voice_name, prefs.rate, prefs.pitch]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Global open + ask events
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    function onAsk(e: Event) {
      const detail = (e as CustomEvent).detail as { prompt?: string };
      setOpen(true);
      if (detail?.prompt) void submitText(detail.prompt);
    }
    window.addEventListener("atlas:open-voice", onOpen);
    window.addEventListener("atlas:ask", onAsk as EventListener);
    return () => {
      window.removeEventListener("atlas:open-voice", onOpen);
      window.removeEventListener("atlas:ask", onAsk as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId]);

  async function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = await ensureConversation();
    await persistMessage(id, "user", trimmed);
    // Retrieve semantically-related records for grounding.
    try {
      const hits = await runSemantic({ data: { query: trimmed, limit: 6 } });
      if (hits.length) {
        semanticRef.current =
          "Relevant records from the user's workspace (retrieved by semantic search):\n" +
          hits
            .map(
              (h) =>
                `- [${h.entity_type}] ${h.label}${h.sub ? ` — ${h.sub}` : ""} (id: ${h.entity_id})`,
            )
            .join("\n");
      } else {
        semanticRef.current = "";
      }
    } catch {
      semanticRef.current = "";
    }
    sendMessage({ text: trimmed });
  }

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim();
      if (transcript) void submitText(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void submitText(input);
    setInput("");
  }

  async function pinConv(id: string, pinned: boolean) {
    await db.from("conversations").update({ pinned }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }
  async function archiveConv(id: string) {
    await db.from("conversations").update({ archived_at: new Date().toISOString() }).eq("id", id);
    if (convId === id) await switchTo(null);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full grid place-items-center transition",
          "bg-gradient-to-br from-atlas-cyan to-atlas-violet text-primary-foreground",
          "shadow-[0_20px_60px_-10px_rgba(0,180,220,0.6)]",
          "hover:scale-105 animate-pulse-glow",
        )}
        aria-label="Open Atlas"
      >
        <Mic className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-3 left-3 sm:left-auto sm:right-6 z-40 sm:w-[440px] sm:max-w-[calc(100vw-2rem)] h-[min(600px,calc(100dvh-8rem))] panel-atlas rounded-2xl flex flex-col overflow-hidden animate-reveal">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-atlas-signal animate-pulse shrink-0" />
              <span className="font-display text-sm">Atlas</span>
              <span className="text-xs text-muted-foreground truncate">
                {busy
                  ? status === "submitted"
                    ? "Thinking…"
                    : "Responding…"
                  : listening
                    ? "Listening…"
                    : "Ready"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPanel(panel === "history" ? "chat" : "history")}
                className="h-8 w-8"
                aria-label="History"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void switchTo(null)}
                className="h-8 w-8"
                aria-label="New conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPanel(panel === "settings" ? "chat" : "settings")}
                className="h-8 w-8"
                aria-label="Voice settings"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  updatePrefs({ muted: !prefs.muted });
                  if (!prefs.muted) window.speechSynthesis?.cancel();
                }}
                className="h-8 w-8"
              >
                {prefs.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {panel === "history" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-2 pb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                Recent conversations
              </p>
              {(conversations.data ?? []).length === 0 && (
                <p className="px-2 py-6 text-sm text-muted-foreground text-center">
                  No conversations yet.
                </p>
              )}
              {(conversations.data ?? []).map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg px-2 py-2 hover:bg-white/5",
                    convId === c.id && "bg-primary/10",
                  )}
                >
                  <button className="flex-1 text-left min-w-0" onClick={() => void switchTo(c.id)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{c.title}</span>
                      {c.pinned && <Pin className="h-3 w-3 text-atlas-signal shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-5">
                      {new Date(c.last_message_at).toLocaleString()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => void pinConv(c.id, !c.pinned)}
                  >
                    <Pin className={cn("h-3.5 w-3.5", c.pinned && "fill-current")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => void archiveConv(c.id)}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {panel === "settings" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Voice
                </label>
                <select
                  className="mt-1 w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
                  value={prefs.voice_name ?? ""}
                  onChange={(e) => updatePrefs({ voice_name: e.target.value || null })}
                >
                  <option value="">Auto</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} — {v.lang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  Speaking rate{" "}
                  <span className="font-mono text-foreground">
                    {Number(prefs.rate).toFixed(2)}×
                  </span>
                </label>
                <Slider
                  className="mt-2"
                  value={[Number(prefs.rate)]}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onValueChange={(v) => updatePrefs({ rate: v[0] })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  Pitch{" "}
                  <span className="font-mono text-foreground">
                    {Number(prefs.pitch).toFixed(2)}
                  </span>
                </label>
                <Slider
                  className="mt-2"
                  value={[Number(prefs.pitch)]}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onValueChange={(v) => updatePrefs({ pitch: v[0] })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-send voice transcripts</span>
                <input
                  type="checkbox"
                  checked={prefs.auto_send_transcripts}
                  onChange={(e) => updatePrefs({ auto_send_transcripts: e.target.checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Preferences save automatically to your account.
              </p>
            </div>
          )}

          {panel === "chat" && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ask Atlas about your operations, revenue, claims, or team. Conversations save
                      automatically.
                    </p>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void submitText(s)}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-white/5 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  messages.map((m) => {
                    const text = extractText(m);
                    return (
                      <div
                        key={m.id}
                        className={cn("text-sm", m.role === "user" ? "text-right" : "text-left")}
                      >
                        <div
                          className={cn(
                            "inline-block max-w-[85%] rounded-2xl px-3 py-2 whitespace-pre-wrap",
                            m.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground",
                          )}
                        >
                          {text ||
                            (m.role === "assistant" && busy ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={submit}
                className="p-3 border-t border-border flex items-center gap-2"
              >
                <Button
                  type="button"
                  variant={listening ? "default" : "secondary"}
                  size="icon"
                  onClick={listening ? () => setListening(false) : startListening}
                  className="h-9 w-9 shrink-0"
                  aria-label="Voice input"
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Atlas anything…"
                  className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {busy ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={stop}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

function useAvailableVoices(active: boolean) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!active || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    function load() {
      setVoices(window.speechSynthesis.getVoices() ?? []);
    }
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, [active]);
  return voices;
}
