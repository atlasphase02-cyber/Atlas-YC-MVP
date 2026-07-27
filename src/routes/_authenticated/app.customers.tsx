import { createFileRoute } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, currentUserId, type Customer } from "@/lib/atlas-db.ts";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/customers")({ component: Page });

type Row = Customer & { claims: { id: string; amount_cents: number }[] };

function Page() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customers", "list"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db
        .from("customers")
        .select("*, claims(id, amount_cents)")
        .order("name");
      if (error) throw error;
      return data as Row[];
    },
  });

  return (
    <PageStub
      title="Customers"
      subtitle={`${data?.length ?? 0} total`}
      askPrompt="Show customers with claims over 30 days old"
    >
      <div className="flex justify-end">
        <NewCustomerDialog onCreated={() => qc.invalidateQueries({ queryKey: ["customers"] })} />
      </div>
      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="No customers yet"
          hint="Add your first customer to start tracking claims."
        />
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {data!.map((c) => {
            const total = c.claims.reduce((s, x) => s + x.amount_cents, 0);
            return (
              <Card key={c.id} className="panel-atlas border-0">
                <CardContent className="p-4">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.address, c.city, c.state].filter(Boolean).join(", ") || "No address"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {c.claims.length} claim{c.claims.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-mono text-foreground">
                      ${(total / 100).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageStub>
  );
}

function NewCustomerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await db
        .from("customers")
        .insert({ owner_id: uid, ...f, name: f.name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer added");
      setOpen(false);
      setF({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        notes: "",
      });
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> New customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            aria-label="Full name"
            placeholder="Full name"
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
          <Input
            aria-label="Street address"
            placeholder="Street address"
            value={f.address}
            onChange={(e) => setF({ ...f, address: e.target.value })}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              aria-label="City"
              placeholder="City"
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
            />
            <Input
              aria-label="State"
              placeholder="State"
              value={f.state}
              onChange={(e) => setF({ ...f, state: e.target.value })}
            />
            <Input
              aria-label="ZIP"
              inputMode="numeric"
              placeholder="ZIP"
              value={f.zip}
              onChange={(e) => setF({ ...f, zip: e.target.value })}
              className="col-span-2 sm:col-auto"
            />
          </div>
          <Textarea
            aria-label="Notes"
            placeholder="Notes"
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} disabled={!f.name.trim() || create.isPending}>
            {create.isPending ? "Saving..." : "Save customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
