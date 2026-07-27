import { createFileRoute, Link } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
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
import {
  db,
  currentUserId,
  formatMoney,
  CLAIM_STATUSES,
  CLAIM_STATUS_LABEL,
  type Claim,
  type ClaimStatus,
  type Customer,
  type Carrier,
} from "@/lib/atlas-db.ts";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/claims")({ component: Page });

type Row = Claim & { customers: { name: string } | null; carriers: { name: string } | null };

function Page() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ClaimStatus>("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["claims", statusFilter],
    queryFn: async (): Promise<Row[]> => {
      let q = db
        .from("claims")
        .select("*, customers(name), carriers(name)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Row[];
    },
  });

  const openCount =
    data?.filter((c) => !["closed", "denied", "approved"].includes(c.status)).length ?? 0;

  return (
    <PageStub
      title="Claims"
      subtitle={`${data?.length ?? 0} total • ${openCount} open`}
      askPrompt="Which claims are waiting on the carrier?"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLAIM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {CLAIM_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NewClaimDialog onCreated={() => qc.invalidateQueries({ queryKey: ["claims"] })} />
      </div>

      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState title="No claims yet" hint="Create your first claim to see it here." />
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <Card className="panel-atlas border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data!.map((c) => (
                <Link
                  key={c.id}
                  to="/app/claims/$claimId"
                  params={{ claimId: c.id }}
                  className="p-4 grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-center sm:justify-between gap-x-4 gap-y-2 hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
                >
                  <div className="min-w-0 sm:flex-1">
                    <p className="text-sm font-medium truncate">
                      {c.claim_number} — {c.customers?.name ?? "Unassigned"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.carriers?.name ?? "No carrier"}
                    </p>
                  </div>
                  <p className="text-sm font-mono text-right sm:w-28 sm:order-3 row-start-1 col-start-2 sm:row-auto sm:col-auto">
                    {formatMoney(c.amount_cents)}
                  </p>
                  <Badge
                    className="justify-self-start sm:justify-self-auto sm:order-2 col-span-2 sm:col-auto"
                    variant={
                      c.status === "approved"
                        ? "default"
                        : c.status === "denied"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {CLAIM_STATUS_LABEL[c.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageStub>
  );
}

function NewClaimDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [claimNumber, setClaimNumber] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [carrierId, setCarrierId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<ClaimStatus>("new");
  const claimNumId = useId();
  const amountId = useId();

  const customers = useQuery({
    queryKey: ["customers", "picker"],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await db.from("customers").select("*").order("name");
      if (error) throw error;
      return data as Customer[];
    },
    enabled: open,
  });
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
      const amountCents = Math.round(parseFloat(amount || "0") * 100);
      const { error } = await db.from("claims").insert({
        owner_id: uid,
        claim_number: claimNumber.trim(),
        customer_id: customerId || null,
        carrier_id: carrierId || null,
        status,
        amount_cents: Number.isFinite(amountCents) ? amountCents : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Claim created");
      setOpen(false);
      setClaimNumber("");
      setCustomerId("");
      setCarrierId("");
      setAmount("");
      setStatus("new");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> New claim
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New claim</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor={claimNumId} className="text-xs text-muted-foreground">
              Claim number
            </label>
            <Input
              id={claimNumId}
              value={claimNumber}
              onChange={(e) => setClaimNumber(e.target.value)}
              placeholder="NPP-2026-0001"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" id={`${claimNumId}-customer-label`}>
              Customer
            </label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger aria-labelledby={`${claimNumId}-customer-label`}>
                <SelectValue
                  placeholder={customers.data?.length ? "Select customer" : "No customers yet"}
                />
              </SelectTrigger>
              <SelectContent>
                {customers.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground" id={`${claimNumId}-carrier-label`}>
              Carrier
            </label>
            <Select value={carrierId} onValueChange={setCarrierId}>
              <SelectTrigger aria-labelledby={`${claimNumId}-carrier-label`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={amountId} className="text-xs text-muted-foreground">
                Amount (USD)
              </label>
              <Input
                id={amountId}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground" id={`${claimNumId}-status-label`}>
                Status
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as ClaimStatus)}>
                <SelectTrigger aria-labelledby={`${claimNumId}-status-label`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CLAIM_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!claimNumber.trim() || create.isPending}
          >
            {create.isPending ? "Creating..." : "Create claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
