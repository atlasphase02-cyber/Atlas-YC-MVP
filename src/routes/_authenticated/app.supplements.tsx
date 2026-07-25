import { createFileRoute, Link } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, currentUserId, formatMoney, type Supplement } from "@/lib/atlas-db.ts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/supplements")({ component: Page });

type Row = Supplement & { claims: { claim_number: string } | null };

function Page() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["supplements", "list"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db.from("supplements")
        .select("*, claims(claim_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const total = data?.reduce((s, x) => s + x.total_cents, 0) ?? 0;

  const generate = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { data: claims, error: cErr } = await db.from("claims").select("id").limit(1);
      if (cErr) throw cErr;
      if (!claims?.length) throw new Error("Create a claim first");
      const { error } = await db.from("supplements").insert({
        owner_id: uid,
        claim_id: claims[0].id,
        status: "draft",
        summary: "AI-drafted supplement — review scope items and pricing before submission.",
        total_cents: 0,
        ai_confidence: 85,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Draft created"); qc.invalidateQueries({ queryKey: ["supplements"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageStub title="Supplements" subtitle={`${data?.length ?? 0} • Est. ${formatMoney(total)}`} askPrompt="Generate today's supplement drafts">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? "Drafting..." : "New draft"}
        </Button>
      </div>
      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState title="No supplements yet" hint="Draft your first supplement from a claim." />
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="grid gap-3">
          {data!.map((s) => (
            <Link key={s.id} to="/app/supplements/$supplementId" params={{ supplementId: s.id }} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg">
              <Card className="panel-atlas border-0 hover:bg-white/5 transition">
                <CardContent className="p-4 grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-center sm:justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium truncate">{s.claims?.claim_number ?? "—"}</p>
                      {s.ai_confidence != null && <Badge variant="secondary">AI • {s.ai_confidence}%</Badge>}
                      <Badge variant={s.status === "approved" ? "default" : s.status === "denied" ? "destructive" : "secondary"}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.summary || "No summary"}</p>
                  </div>
                  <p className="text-sm font-mono text-atlas-signal shrink-0 self-start sm:self-center">{formatMoney(s.total_cents)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageStub>
  );
}
