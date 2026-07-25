import { createFileRoute } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LoadingList, ErrorState } from "@/components/data-states.tsx";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/components/route-boundaries.tsx";
import { useQuery } from "@tanstack/react-query";
import { db, formatMoney, CLAIM_STATUS_LABEL, type ClaimStatus } from "@/lib/atlas-db.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/analytics")({
  component: Page,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function Page() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "claims"],
    queryFn: async () => {
      const { data, error } = await db.from("claims").select("status, amount_cents");
      if (error) throw error;
      return data as { status: ClaimStatus; amount_cents: number }[];
    },
  });

  const byStatus = new Map<ClaimStatus, { count: number; total: number }>();
  data?.forEach((c) => {
    const entry = byStatus.get(c.status) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += c.amount_cents;
    byStatus.set(c.status, entry);
  });
  const total = data?.reduce((s, x) => s + x.amount_cents, 0) ?? 0;

  return (
    <PageStub title="Analytics" subtitle="Pipeline snapshot" askPrompt="Compare this month to last">
      <ExecutiveSummary />
      {isLoading && <LoadingList rows={3} />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (
        <>
          <Card className="panel-atlas border-0">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Pipeline value</p>
              <p className="font-display text-3xl mt-2">{formatMoney(total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{data?.length ?? 0} claims tracked</p>
            </CardContent>
          </Card>
          <div className="grid gap-3">
            {[...byStatus.entries()].map(([status, v]) => (
              <Card key={status} className="panel-atlas border-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{CLAIM_STATUS_LABEL[status]}</p>
                    <p className="text-xs text-muted-foreground">{v.count} claim{v.count !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="text-sm font-mono">{formatMoney(v.total)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageStub>
  );
}

function ExecutiveSummary() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    setText("");
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/ai/executive-summary", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok || !res.body) throw new Error(await res.text() || "Failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setText(acc);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-atlas-signal shrink-0" aria-hidden="true" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground truncate">Executive summary</p>
          </div>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden="true" />Generating…</> : text ? "Regenerate" : "Generate"}
          </Button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
        {text ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        ) : !loading && !err ? (
          <p className="text-xs text-muted-foreground">Get an AI briefing on pipeline health, stalled claims, and recommended next actions.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
