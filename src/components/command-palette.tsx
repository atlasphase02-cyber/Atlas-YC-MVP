import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command.tsx";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, FileText, Sparkles, Users, UserCog, FolderOpen, Calendar,
  BarChart3, Bell, Settings, MessageSquare, Search, Wand2, Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/atlas-db.ts";
import { parseNlCommand } from "@/lib/nl-nav.functions.ts";
import { semanticSearch, type SemanticHit } from "@/lib/semantic-search.functions.ts";

const ITEMS = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/claims", label: "Claims", icon: FileText },
  { to: "/app/supplements", label: "Supplements", icon: Sparkles },
  { to: "/app/customers", label: "Customers", icon: Users },
  { to: "/app/adjusters", label: "Adjusters", icon: UserCog },
  { to: "/app/documents", label: "Documents", icon: FolderOpen },
  { to: "/app/interview", label: "AI Interview", icon: MessageSquare },
  { to: "/app/calendar", label: "Calendar", icon: Calendar },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const ASK_PROMPTS = [
  "Show me today's revenue at risk",
  "Which claims are waiting on State Farm?",
  "Generate today's supplements",
  "What should I focus on this morning?",
];

type Hit =
  | { kind: "claim"; id: string; label: string; sub?: string }
  | { kind: "customer"; id: string; label: string; sub?: string }
  | { kind: "adjuster"; id: string; label: string; sub?: string }
  | { kind: "document"; id: string; label: string; sub?: string };

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [semantic, setSemantic] = useState<SemanticHit[]>([]);
  const [nlBusy, setNlBusy] = useState(false);
  const [clarify, setClarify] = useState<string | null>(null);

  const runParse = useServerFn(parseNlCommand);
  const runSemantic = useServerFn(semanticSearch);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) { setHits([]); setSemantic([]); setClarify(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const like = `%${q}%`;
      const [claims, customers, adjusters, docs] = await Promise.all([
        db.from("claims").select("id, claim_number, description").or(`claim_number.ilike.${like},description.ilike.${like}`).limit(4),
        db.from("customers").select("id, name, email").or(`name.ilike.${like},email.ilike.${like}`).limit(4),
        db.from("adjusters").select("id, name, email").or(`name.ilike.${like},email.ilike.${like}`).limit(4),
        db.from("documents").select("id, name, folder").ilike("name", like).limit(4),
      ]);
      if (cancelled) return;
      const merged: Hit[] = [
        ...((claims.data ?? []) as { id: string; claim_number: string; description: string | null }[]).map((c) => ({
          kind: "claim" as const, id: c.id, label: c.claim_number, sub: c.description ?? undefined,
        })),
        ...((customers.data ?? []) as { id: string; name: string; email: string | null }[]).map((c) => ({
          kind: "customer" as const, id: c.id, label: c.name, sub: c.email ?? undefined,
        })),
        ...((adjusters.data ?? []) as { id: string; name: string; email: string | null }[]).map((a) => ({
          kind: "adjuster" as const, id: a.id, label: a.name, sub: a.email ?? undefined,
        })),
        ...((docs.data ?? []) as { id: string; name: string; folder: string }[]).map((d) => ({
          kind: "document" as const, id: d.id, label: d.name, sub: d.folder,
        })),
      ];
      setHits(merged);

      // Semantic search (fire-and-forget, longer than 3 chars)
      if (q.length >= 4) {
        try {
          const res = await runSemantic({ data: { query: q, limit: 6 } });
          if (!cancelled) setSemantic(res);
        } catch { /* embeddings may be pending — silent */ }
      } else {
        setSemantic([]);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open, runSemantic]);

  function go(to: string) { onOpenChange(false); setQuery(""); navigate({ to: to as never }); }
  function ask(prompt: string) { onOpenChange(false); setQuery(""); window.dispatchEvent(new CustomEvent("atlas:ask", { detail: { prompt } })); }
  function openHit(kind: string, id: string) {
    onOpenChange(false); setQuery("");
    if (kind === "claims" || kind === "claim") navigate({ to: "/app/claims/$claimId", params: { claimId: id } });
    else if (kind === "supplements") navigate({ to: "/app/supplements/$supplementId", params: { supplementId: id } });
    else if (kind === "customers" || kind === "customer") navigate({ to: "/app/customers" });
    else if (kind === "adjusters" || kind === "adjuster") navigate({ to: "/app/adjusters" });
    else if (kind === "documents" || kind === "document") navigate({ to: "/app/documents" });
    else if (kind === "notes") navigate({ to: "/app/claims" });
    else if (kind === "conversations") window.dispatchEvent(new CustomEvent("atlas:open-voice"));
  }

  async function runNlCommand() {
    const q = query.trim();
    if (!q || nlBusy) return;
    setNlBusy(true); setClarify(null);
    try {
      const intent = await runParse({ data: { query: q } });
      if (intent.intent === "ask") {
        ask(intent.ask_prompt || q);
      } else if (intent.intent === "navigate" && intent.route) {
        // Append filters as querystring if any
        const qp = intent.filters ? "?" + new URLSearchParams(intent.filters).toString() : "";
        go(intent.route + qp);
      } else if (intent.intent === "create" && intent.route) {
        go(intent.route + "?new=1");
      } else if (intent.intent === "open_entity" && intent.entity_type && intent.entity_query) {
        // Try exact claim match first
        if (intent.entity_type === "claims") {
          const { data } = await db.from("claims").select("id").ilike("claim_number", intent.entity_query).limit(1).maybeSingle();
          if (data?.id) return openHit("claims", data.id);
        }
        // Fallback: semantic search that entity type
        const res = await runSemantic({ data: { query: intent.entity_query, types: [intent.entity_type as SemanticHit["entity_type"]], limit: 1 } });
        if (res[0]) return openHit(res[0].entity_type, res[0].entity_id);
        setClarify(`No ${intent.entity_type} matched "${intent.entity_query}".`);
      } else if (intent.intent === "clarify") {
        setClarify(intent.clarify_question || "Can you be more specific?");
      } else {
        ask(q);
      }
    } catch (e) {
      console.error(e);
      ask(q);
    } finally {
      setNlBusy(false);
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search or ask Atlas — try 'show supplements awaiting approval'"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {query.trim() && (
          <CommandGroup heading="Atlas">
            <CommandItem onSelect={runNlCommand} value={`__nl__${query}`}>
              {nlBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4 text-primary" />}
              <span className="truncate">Interpret: "{query}"</span>
            </CommandItem>
            {clarify && (
              <CommandItem disabled value="__clarify__">
                <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{clarify}</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}
        {hits.length > 0 && (
          <CommandGroup heading="Matches">
            {hits.map((h) => (
              <CommandItem key={`${h.kind}:${h.id}`} onSelect={() => openHit(h.kind, h.id)} value={`match-${h.kind}-${h.id}-${h.label}`}>
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="mr-2 text-[10px] uppercase text-muted-foreground">{h.kind}</span>
                <span className="truncate">{h.label}</span>
                {h.sub && <span className="ml-2 text-xs text-muted-foreground truncate">— {h.sub}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {semantic.length > 0 && (
          <CommandGroup heading="Related by meaning">
            {semantic.map((h) => (
              <CommandItem key={`sem-${h.entity_type}:${h.entity_id}`} onSelect={() => openHit(h.entity_type, h.entity_id)} value={`sem-${h.entity_type}-${h.entity_id}-${h.label}`}>
                <Sparkles className="mr-2 h-4 w-4 text-atlas-signal" />
                <span className="mr-2 text-[10px] uppercase text-muted-foreground">{h.entity_type}</span>
                <span className="truncate">{h.label || "(untitled)"}</span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">{(h.similarity * 100).toFixed(0)}%</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Ask Atlas">
          {ASK_PROMPTS.map((p) => (
            <CommandItem key={p} onSelect={() => ask(p)} value={`ask-${p}`}>
              <MessageSquare className="mr-2 h-4 w-4 text-primary" /> {p}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Navigate">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.to} onSelect={() => go(item.to)} value={`nav-${item.label}`}>
                <Icon className="mr-2 h-4 w-4" /> {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
