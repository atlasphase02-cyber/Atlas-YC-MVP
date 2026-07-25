import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { LoadingList, EmptyState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, currentUserId, type Interview, type InterviewTurn, type InterviewActionItem } from "@/lib/atlas-db.ts";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Plus, Send, CheckCircle2, Loader2, Trash2, Mic } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

export const Route = createFileRoute("/_authenticated/app/interview")({ component: Page });

const KICKOFF = "Hi, I'm Atlas. I'll ask a few short questions to capture this claim. Let's start with what happened — where was the damage first noticed, and when?";

function turnsToUI(t: InterviewTurn[]): UIMessage[] {
  return t.map((x, i) => ({
    id: `${i}-${x.at}`,
    role: x.role,
    parts: [{ type: "text", text: x.content }],
  })) as UIMessage[];
}
function extract(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
}

function Page() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["interviews"],
    queryFn: async (): Promise<Interview[]> => {
      const { data, error } = await db.from("interviews")
        .select("*").order("updated_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data as Interview[]) ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId(); if (!uid) throw new Error("Not signed in");
      const seed: InterviewTurn[] = [{ role: "assistant", content: KICKOFF, at: new Date().toISOString() }];
      const { data, error } = await db.from("interviews")
        .insert({ owner_id: uid, transcript: seed, title: `Interview ${new Date().toLocaleDateString()}` })
        .select("id").single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (id) => { qc.invalidateQueries({ queryKey: ["interviews"] }); setActiveId(id); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("interviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["interviews"] });
      if (activeId === id) setActiveId(null);
    },
  });

  return (
    <AppShell title="AI Interview" subtitle="Conversational intake, saved and summarized">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="panel-atlas border-0">
          <CardContent className="p-3 space-y-2">
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              New interview
            </Button>
            <div className="space-y-1 max-h-[520px] overflow-y-auto">
              {list.isLoading && <LoadingList rows={3} />}
              {!list.isLoading && (list.data?.length ?? 0) === 0 && (
                <EmptyState title="No interviews yet" hint="Start one to walk a customer through intake." />
              )}
              {list.data?.map((iv) => (
                <button
                  key={iv.id}
                  onClick={() => setActiveId(iv.id)}
                  className={cn(
                    "w-full text-left p-2 rounded-lg hover:bg-white/5 transition",
                    activeId === iv.id && "bg-primary/10 border border-primary/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{iv.title}</span>
                    <Badge variant={iv.status === "completed" ? "secondary" : "default"} className="shrink-0 text-[10px]">
                      {iv.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(iv.updated_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          {activeId ? (
            <InterviewPanel id={activeId} onDelete={(id) => del.mutate(id)} />
          ) : (
            <Card className="panel-atlas border-0"><CardContent className="p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-atlas-cyan to-atlas-violet grid place-items-center mb-4">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="font-display text-lg">Atlas Interview</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Start a new interview or pick one from the left. Every turn is saved automatically and Atlas can generate a summary + action items when you finish.
              </p>
            </CardContent></Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function InterviewPanel({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["interview", id],
    queryFn: async (): Promise<Interview> => {
      const { data, error } = await db.from("interviews").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Interview;
    },
  });

  const iv = q.data;
  const initial = useMemo(() => (iv ? turnsToUI(iv.transcript) : []), [iv]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages }) => ({
      body: {
        messages,
        systemExtra: `You are conducting a structured intake interview for an insurance restoration claim.
Ask ONE focused question at a time. Cover: date/time of loss, cause, affected areas, prior damage, mitigation already done, insurance carrier, policy number if known, timeline expectations, and any code/permit concerns.
Stay brief and warm. Do not summarize until asked.`,
      },
    }),
  }), []);

  const { messages, sendMessage, status } = useChat({
    id,
    messages: initial,
    transport,
    onFinish: async ({ message }) => {
      const text = extract(message as UIMessage);
      if (!text || !iv) return;
      const nextTurn: InterviewTurn = { role: "assistant", content: text, at: new Date().toISOString() };
      const updated = [...iv.transcript, nextTurn];
      await db.from("interviews").update({ transcript: updated }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["interview", id] });
      qc.invalidateQueries({ queryKey: ["interviews"] });
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !iv) return;
    const nextTurn: InterviewTurn = { role: "user", content: trimmed, at: new Date().toISOString() };
    const updated = [...iv.transcript, nextTurn];
    await db.from("interviews").update({ transcript: updated }).eq("id", id);
    qc.setQueryData(["interview", id], { ...iv, transcript: updated });
    sendMessage({ text: trimmed });
    setInput("");
  }

  async function generateSummary() {
    if (!iv) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/interview-summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: iv.transcript }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { summary: string; action_items: InterviewActionItem[]; insights: string };
      await db.from("interviews").update({
        summary: data.summary,
        action_items: data.action_items,
        insights: data.insights,
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["interview", id] });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Interview summarized");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (q.isLoading || !iv) return <LoadingList />;

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="panel-atlas border-0 flex flex-col h-[min(600px,calc(100dvh-14rem))] lg:h-[600px]">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-atlas-cyan to-atlas-violet grid place-items-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm truncate">{iv.title}</p>
                <p className="text-[10px] text-muted-foreground">{iv.transcript.length} turns · {iv.status}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Delete interview" onClick={() => onDelete(id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cn("text-sm", m.role === "user" ? "text-right" : "text-left")}>
                <div className={cn(
                  "inline-block max-w-[80%] rounded-2xl px-3 py-2 whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/5"
                )}>
                  {extract(m) || (m.role === "assistant" && busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null)}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="p-3 border-t border-border flex items-center gap-2">
            <label htmlFor="interview-input" className="sr-only">Your answer</label>
            <input id="interview-input" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Answer the question…"
              className="flex-1 min-w-0 bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Button type="button" size="icon" variant="secondary" aria-label="Open voice input" onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-voice"))}>
              <Mic className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim() || busy}>
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card className="panel-atlas border-0"><CardContent className="p-4 space-y-3">
          <Button className="w-full" onClick={() => void generateSummary()} disabled={generating || iv.transcript.length < 2}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {iv.summary ? "Regenerate summary" : "Generate summary"}
          </Button>
        </CardContent></Card>
        {iv.summary && (
          <Card className="panel-atlas border-0"><CardContent className="p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Summary</p>
            <p className="text-sm whitespace-pre-wrap">{iv.summary}</p>
            {iv.action_items?.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-widest text-muted-foreground pt-2">Action items</p>
                <ul className="space-y-1">
                  {iv.action_items.map((a, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-atlas-signal shrink-0" />
                      <span>{a.title}{a.owner ? ` — ${a.owner}` : ""}{a.due ? ` (${a.due})` : ""}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {iv.insights && (
              <>
                <p className="text-xs uppercase tracking-widest text-muted-foreground pt-2">Insights</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{iv.insights}</p>
              </>
            )}
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
