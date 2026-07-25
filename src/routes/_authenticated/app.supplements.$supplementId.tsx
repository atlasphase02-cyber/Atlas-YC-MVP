import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { LoadingList, ErrorState, EmptyState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  db, currentUserId, formatMoney,
  SUPPLEMENT_STATUSES,
  type Supplement, type SupplementItem, type SupplementStatus,
} from "@/lib/atlas-db.ts";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Printer, Sparkles, Loader2 } from "lucide-react";


export const Route = createFileRoute("/_authenticated/app/supplements/$supplementId")({ component: Page });

type SuppWithClaim = Supplement & { claims: { id: string; claim_number: string } | null };

function Page() {
  const { supplementId } = Route.useParams();
  const qc = useQueryClient();

  const supp = useQuery({
    queryKey: ["supplement", supplementId],
    queryFn: async (): Promise<SuppWithClaim> => {
      const { data, error } = await db.from("supplements")
        .select("*, claims(id, claim_number)").eq("id", supplementId).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Supplement not found");
      return data as SuppWithClaim;
    },
  });

  const items = useQuery({
    queryKey: ["supplement-items", supplementId],
    queryFn: async (): Promise<SupplementItem[]> => {
      const { data, error } = await db.from("supplement_items")
        .select("*").eq("supplement_id", supplementId).order("created_at", { ascending: true });
      if (error) throw error;
      return data as SupplementItem[];
    },
  });

  const total = (items.data ?? []).reduce((s, i) => s + Math.round(Number(i.quantity) * i.unit_price_cents), 0);

  // Persist total whenever items change
  useEffect(() => {
    if (!items.data || !supp.data) return;
    if (total === supp.data.total_cents) return;
    db.from("supplements").update({ total_cents: total }).eq("id", supplementId).then(() => {
      qc.invalidateQueries({ queryKey: ["supplement", supplementId] });
      qc.invalidateQueries({ queryKey: ["supplements"] });
    });
  }, [total, items.data, supp.data, supplementId, qc]);

  const addItem = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId(); if (!uid) throw new Error("Not signed in");
      const { error } = await db.from("supplement_items").insert({
        owner_id: uid, supplement_id: supplementId,
        description: "New line item", quantity: 1, unit_price_cents: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplement-items", supplementId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async (patch: Partial<SupplementItem> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await db.from("supplement_items").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplement-items", supplementId] }),
  });

  const delItem = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("supplement_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplement-items", supplementId] }),
  });

  const updateSupp = useMutation({
    mutationFn: async (patch: Partial<Supplement>) => {
      const { error } = await db.from("supplements").update(patch).eq("id", supplementId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["supplement", supplementId] }); qc.invalidateQueries({ queryKey: ["supplements"] }); },
  });

  const aiGenerate = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId(); if (!uid) throw new Error("Not signed in");
      const res = await fetch("/api/ai/supplement-generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          claim_summary: `Claim ${supp.data?.claims?.claim_number ?? ""}. ${supp.data?.summary ?? ""}`,
          existing_items: (items.data ?? []).map((i) => ({
            description: i.description, quantity: i.quantity, unit_price_cents: i.unit_price_cents,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as {
        summary: string; confidence: number;
        items: { description: string; quantity: number; unit_price_cents: number; confidence: number; reason: string }[];
        recommendations: string[];
      };
      if (data.items.length > 0) {
        const rows = data.items.map((it) => ({
          owner_id: uid, supplement_id: supplementId,
          description: it.description, quantity: it.quantity, unit_price_cents: Math.round(it.unit_price_cents),
          ai_suggested: true, ai_confidence: Math.round(it.confidence), ai_reason: it.reason,
        }));
        const { error } = await db.from("supplement_items").insert(rows);
        if (error) throw error;
      }
      await db.from("supplements").update({
        ai_summary: data.summary,
        ai_confidence: Math.round(data.confidence),
        ai_recommendations: data.recommendations ?? [],
      }).eq("id", supplementId);
      return data.items.length;
    },
    onSuccess: (n) => {
      toast.success(`Atlas added ${n} suggested item${n === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["supplement", supplementId] });
      qc.invalidateQueries({ queryKey: ["supplement-items", supplementId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  if (supp.isLoading) return <AppShell title="Supplement"><LoadingList /></AppShell>;
  if (supp.error || !supp.data) return (
    <AppShell title="Supplement">
      <ErrorState message={(supp.error as Error)?.message ?? "Not found"} onRetry={() => supp.refetch()} />
    </AppShell>
  );

  const s = supp.data;

  return (
    <AppShell title={`Supplement · ${s.claims?.claim_number ?? ""}`} subtitle={formatMoney(total)}>
      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="justify-self-start">
            <Link to="/app/supplements"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Supplements</Link>
          </Button>
          <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
            <Select value={s.status} onValueChange={(v) => updateSupp.mutate({ status: v as SupplementStatus })}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Supplement status"><SelectValue /></SelectTrigger>
              <SelectContent>{SUPPLEMENT_STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={() => aiGenerate.mutate()} disabled={aiGenerate.isPending}>
              {aiGenerate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />}
              Draft with AI
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Print
            </Button>
          </div>
        </div>

        <Card className="panel-atlas border-0"><CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            {s.ai_confidence != null && <Badge variant="secondary">AI · {s.ai_confidence}%</Badge>}
            <Badge>{s.status}</Badge>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Summary</label>
            <Textarea rows={3} defaultValue={s.summary ?? ""} onBlur={(e) => updateSupp.mutate({ summary: e.target.value })} />
          </div>
          {s.ai_summary && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-widest text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Atlas summary
              </p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{s.ai_summary}</p>
            </div>
          )}
          {s.ai_recommendations?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Atlas recommendations</p>
              <ul className="mt-1 space-y-1">
                {s.ai_recommendations.map((r, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Sparkles className="h-3 w-3 mt-1 text-atlas-signal shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent></Card>

        <Card className="panel-atlas border-0"><CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-2">
            <p className="font-display">Line items</p>
            <Button size="sm" onClick={() => addItem.mutate()} disabled={addItem.isPending}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Add item
            </Button>
          </div>
          {items.isLoading ? <div className="p-4"><LoadingList rows={2} /></div> :
            !items.data?.length ? <div className="p-4"><EmptyState title="No line items" hint="Add scope items or click Draft with AI." /></div> :
            <div className="overflow-x-auto">
              <div className="divide-y divide-border min-w-[640px]">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                {items.data.map((it) => (
                  <ItemRow key={it.id} item={it}
                    onChange={(patch) => updateItem.mutate({ id: it.id, ...patch })}
                    onDelete={() => delItem.mutate(it.id)} />
                ))}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5">
                  <div className="col-span-10 text-right text-sm text-muted-foreground">Total</div>
                  <div className="col-span-1 text-right font-mono text-atlas-signal">{formatMoney(total)}</div>
                  <div className="col-span-1"></div>
                </div>
              </div>
            </div>}
        </CardContent></Card>
      </div>
    </AppShell>

  );
}

function ItemRow({ item, onChange, onDelete }: {
  item: SupplementItem;
  onChange: (patch: Partial<SupplementItem>) => void;
  onDelete: () => void;
}) {
  const [desc, setDesc] = useState(item.description);
  const [qty, setQty] = useState(String(item.quantity));
  const [unit, setUnit] = useState((item.unit_price_cents / 100).toFixed(2));
  useEffect(() => { setDesc(item.description); setQty(String(item.quantity)); setUnit((item.unit_price_cents / 100).toFixed(2)); },
    [item.id, item.description, item.quantity, item.unit_price_cents]);
  const total = Math.round(Number(qty || 0) * Math.round(Number(unit || 0) * 100));
  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-2 items-center">
      <div className="col-span-6"><label className="sr-only">Description</label><Input value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => onChange({ description: desc })} /></div>
      <div className="col-span-2"><label className="sr-only">Quantity</label><Input className="text-right" value={qty} inputMode="decimal" onChange={(e) => setQty(e.target.value)} onBlur={() => onChange({ quantity: Number(qty) || 0 })} /></div>
      <div className="col-span-2"><label className="sr-only">Unit price</label><Input className="text-right" value={unit} inputMode="decimal" onChange={(e) => setUnit(e.target.value)} onBlur={() => onChange({ unit_price_cents: Math.round(Number(unit) * 100) || 0 })} /></div>
      <div className="col-span-1 text-right font-mono text-sm">{formatMoney(total)}</div>
      <div className="col-span-1 text-right"><Button variant="ghost" size="icon" aria-label="Delete line item" onClick={onDelete}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button></div>
    </div>
  );
}
