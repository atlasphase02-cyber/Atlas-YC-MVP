import { createFileRoute } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, currentUserId, type Adjuster, type Carrier } from "@/lib/atlas-db.ts";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/adjusters")({ component: Page });

type Row = Adjuster & { carriers: { name: string } | null; claims: { id: string }[] };

function Page() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adjusters", "list"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db
        .from("adjusters")
        .select("*, carriers(name), claims(id)")
        .order("name");
      if (error) throw error;
      return data as Row[];
    },
  });

  return (
    <PageStub
      title="Adjusters"
      subtitle={`${data?.length ?? 0} active relationships`}
      askPrompt="Which adjusters respond fastest this month?"
    >
      <div className="flex justify-end">
        <NewAdjusterDialog onCreated={() => qc.invalidateQueries({ queryKey: ["adjusters"] })} />
      </div>
      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState title="No adjusters yet" hint="Add adjusters to track carrier relationships." />
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {data!.map((a) => (
            <Card key={a.id} className="panel-atlas border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{a.name}</p>
                  {a.carriers?.name && <Badge variant="secondary">{a.carriers.name}</Badge>}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a.claims.length} active claims</span>
                  <span className="font-mono">
                    {a.avg_response_hours != null ? `avg ${a.avg_response_hours}h` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageStub>
  );
}

function NewAdjusterDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", carrier_id: "" });
  const carriers = useQuery({
    queryKey: ["carriers", "picker"],
    queryFn: async (): Promise<Carrier[]> => {
      const { data, error } = await db.from("carriers").select("*").order("name");
      if (error) throw error;
      return data as Carrier[];
    },
    enabled: open,
  });
  const create = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await db.from("adjusters").insert({
        owner_id: uid,
        name: f.name.trim(),
        email: f.email || null,
        phone: f.phone || null,
        carrier_id: f.carrier_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adjuster added");
      setOpen(false);
      setF({ name: "", email: "", phone: "", carrier_id: "" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> New adjuster
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New adjuster</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            aria-label="Adjuster name"
            placeholder="Name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              aria-label="Email"
              type="email"
              placeholder="Email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
            <Input
              aria-label="Phone"
              type="tel"
              placeholder="Phone"
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </div>
          <Select value={f.carrier_id} onValueChange={(v) => setF({ ...f, carrier_id: v })}>
            <SelectTrigger aria-label="Carrier">
              <SelectValue
                placeholder={carriers.data?.length ? "Select carrier" : "No carriers yet"}
              />
            </SelectTrigger>
            <SelectContent>
              {carriers.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} disabled={!f.name.trim() || create.isPending}>
            {create.isPending ? "Saving..." : "Save adjuster"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
