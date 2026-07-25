import { createFileRoute } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, currentUserId, type Appointment, type AppointmentKind } from "@/lib/atlas-db.ts";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/calendar")({ component: Page });

const KINDS: AppointmentKind[] = ["inspection", "call", "meeting", "deadline", "task"];

function Page() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", "list"],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await db.from("appointments")
        .select("*")
        .gte("starts_at", new Date(Date.now() - 24 * 3600_000).toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as Appointment[];
    },
  });

  return (
    <PageStub title="Calendar" subtitle="Appointments, inspections, deadlines" askPrompt="Schedule an inspection tomorrow morning">
      <div className="flex justify-end">
        <NewAppointmentDialog onCreated={() => qc.invalidateQueries({ queryKey: ["appointments"] })} />
      </div>
      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState title="Nothing scheduled" hint="Add your first appointment or deadline." />
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="grid gap-3">
          {data!.map((e) => {
            const d = new Date(e.starts_at);
            return (
              <Card key={e.id} className="panel-atlas border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                    <Badge variant="secondary">{e.kind}</Badge>
                  </div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.who ?? e.location ?? ""}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageStub>
  );
}

function NewAppointmentDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", kind: "inspection" as AppointmentKind, starts_at: "", who: "", location: "" });
  const create = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      if (!f.starts_at) throw new Error("Pick a start time");
      const { error } = await db.from("appointments").insert({
        owner_id: uid,
        title: f.title.trim(),
        kind: f.kind,
        starts_at: new Date(f.starts_at).toISOString(),
        who: f.who || null,
        location: f.location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scheduled");
      setOpen(false);
      setF({ title: "", kind: "inspection", starts_at: "", who: "", location: "" });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New event</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input aria-label="Event title" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as AppointmentKind })}>
              <SelectTrigger aria-label="Event kind"><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
            <Input aria-label="Start date and time" type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
          </div>
          <Input aria-label="Who" placeholder="Who" value={f.who} onChange={(e) => setF({ ...f, who: e.target.value })} />
          <Input aria-label="Location" placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!f.title.trim() || create.isPending}>
            {create.isPending ? "Saving..." : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
