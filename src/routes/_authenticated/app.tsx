import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { db, formatMoney, type ClaimStatus, type Appointment } from "@/lib/atlas-db.ts";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp, AlertCircle, Sparkles, Users, FileText, Clock } from "lucide-react";
import { generateRecommendations, type Recommendation } from "@/lib/recommendations.functions.ts";
import { processEmbedQueue } from "@/lib/embeddings.functions.ts";

export const Route = createFileRoute("/_authenticated/app")({
  component: DashboardPage,
});

const OPEN_STATUSES: ClaimStatus[] = ["new", "inspection_scheduled", "waiting_on_carrier", "supplement_pending"];

function DashboardPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      setName((meta?.full_name || meta?.name || data.user?.email?.split("@")[0] || "there").split(" ")[0]);
    });
  }, []);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  const metrics = useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: async () => {
      const [claimsRes, suppRes, custRes] = await Promise.all([
        db.from("claims").select("status, amount_cents"),
        db.from("supplements").select("status, total_cents"),
        db.from("customers").select("id", { count: "exact", head: true }),
      ]);
      if (claimsRes.error) throw claimsRes.error;
      if (suppRes.error) throw suppRes.error;
      if (custRes.error) throw custRes.error;
      const claims = claimsRes.data as { status: ClaimStatus; amount_cents: number }[];
      const supplements = suppRes.data as { status: string; total_cents: number }[];
      const openClaims = claims.filter((c) => OPEN_STATUSES.includes(c.status));
      const revenueAtRisk = openClaims.reduce((s, c) => s + c.amount_cents, 0);
      const suppPending = supplements.filter((s) => s.status === "draft" || s.status === "submitted");
      const suppValue = suppPending.reduce((s, x) => s + x.total_cents, 0);
      return {
        revenueAtRisk,
        openClaims: openClaims.length,
        suppCount: suppPending.length,
        suppValue,
        customers: custRes.count ?? 0,
      };
    },
  });

  const agenda = useQuery({
    queryKey: ["dashboard", "agenda"],
    queryFn: async (): Promise<Appointment[]> => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setDate(end.getDate() + 1); end.setHours(0, 0, 0, 0);
      const { data, error } = await db.from("appointments")
        .select("*")
        .gte("starts_at", start.toISOString())
        .lt("starts_at", end.toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const runRecs = useServerFn(generateRecommendations);
  const recs = useQuery({
    queryKey: ["dashboard", "recommendations"],
    queryFn: (): Promise<Recommendation[]> => runRecs(),
    staleTime: 60_000,
  });

  // Background: process any pending embeddings so semantic search stays fresh.
  const runEmbed = useServerFn(processEmbedQueue);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (let i = 0; i < 3 && !cancelled; i++) {
          const r = await runEmbed({ data: { limit: 20 } });
          if (!r.remaining) break;
        }
      } catch (e) { console.warn("embed queue", e); }
    })();
    return () => { cancelled = true; };
  }, [runEmbed]);

  return (
    <AppShell title={`${greeting}, ${name || "there"}.`} subtitle="Here's where the business stands right now.">
      <div className="space-y-6">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-voice"))}
          className="w-full text-left panel-atlas rounded-2xl p-5 hover:border-primary/30 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-atlas-cyan to-atlas-violet grid place-items-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Ask Atlas</p>
              <p className="font-display text-base">"What should I focus on this morning?"</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric icon={TrendingUp} label="Revenue at risk" value={metrics.data ? formatMoney(metrics.data.revenueAtRisk) : null} trend={`${metrics.data?.openClaims ?? 0} open claims`} tone="warning" loading={metrics.isLoading} />
          <Metric icon={FileText} label="Open claims" value={metrics.data ? String(metrics.data.openClaims) : null} trend="Awaiting action" tone="default" loading={metrics.isLoading} />
          <Metric icon={Sparkles} label="Supplements pending" value={metrics.data ? String(metrics.data.suppCount) : null} trend={metrics.data ? `Est. ${formatMoney(metrics.data.suppValue)}` : ""} tone="signal" loading={metrics.isLoading} />
          <Metric icon={Users} label="Customers" value={metrics.data ? String(metrics.data.customers) : null} trend="Active in Atlas" tone="default" loading={metrics.isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 panel-atlas border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Atlas recommends
              </CardTitle>
              <Badge variant="secondary">{recs.data?.length ?? 0} live</Badge>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {recs.isLoading && <div className="py-3"><Skeleton className="h-10 w-full" /></div>}
              {!recs.isLoading && (recs.data?.length ?? 0) === 0 && (
                <p className="py-6 text-sm text-muted-foreground text-center">All clear. Nothing needs your attention right now.</p>
              )}
              {recs.data?.map((r) => (
                <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.priority === "high" ? "destructive" : "secondary"} className="uppercase text-[10px]">{r.priority}</Badge>
                      <p className="text-sm font-medium truncate">{r.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.why}</p>
                  </div>
                  {r.action?.route ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: r.action!.route as any })}>{r.action.label} <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  ) : r.action?.ask ? (
                    <Button size="sm" variant="ghost" onClick={() => window.dispatchEvent(new CustomEvent("atlas:ask", { detail: { prompt: r.action!.ask } }))}>{r.action.label}</Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>


          <Card className="panel-atlas border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agenda.isLoading && <Skeleton className="h-16 w-full" />}
              {!agenda.isLoading && (agenda.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Nothing scheduled today.</p>
              )}
              {agenda.data?.map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="text-xs text-muted-foreground">{new Date(a.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                  <p className="font-medium">{a.title}</p>
                  {a.who && <p className="text-xs text-muted-foreground">{a.who}</p>}
                </div>
              ))}
              <Button size="sm" variant="ghost" className="w-full" onClick={() => window.dispatchEvent(new CustomEvent("atlas:ask", { detail: { prompt: "Summarize my day" } }))}>
                <Sparkles className="mr-2 h-3 w-3" /> Summarize my day
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, trend, tone, loading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null; trend: string; tone: "default" | "warning" | "signal"; loading: boolean }) {
  const toneClass = tone === "warning" ? "text-atlas-violet" : tone === "signal" ? "text-atlas-signal" : "text-primary";
  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <Icon className={`h-4 w-4 ${toneClass}`} />
        </div>
        {loading || value === null ? (
          <Skeleton className="h-8 w-24 mt-2" />
        ) : (
          <p className="font-display text-3xl mt-2">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}
