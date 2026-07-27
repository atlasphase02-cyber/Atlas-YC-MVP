import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  db,
  currentUserId,
  formatMoney,
  logClaimEvent,
  uploadFile,
  signedUrl,
  deleteFile,
  DOC_BUCKET,
  PHOTO_BUCKET,
  CLAIM_STATUSES,
  CLAIM_STATUS_LABEL,
  type Claim,
  type ClaimStatus,
  type Note,
  type ClaimComment,
  type ClaimEvent,
  type AppDocument,
  type Photo,
  type Supplement,
  type Appointment,
} from "@/lib/atlas-db.ts";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { AtlasAnalysis } from "@/components/atlas-analysis.tsx";
import {
  ArrowLeft,
  Trash2,
  Upload,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Calendar as CalIcon,
  Sparkles,
  Archive,
  Brain,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/claims/$claimId")({ component: Page });

type ClaimWithRels = Claim & {
  customers: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  carriers: { name: string; email: string | null; phone: string | null } | null;
  adjusters: { name: string; email: string | null; phone: string | null } | null;
};

function Page() {
  const { claimId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: claim,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["claim", claimId],
    queryFn: async (): Promise<ClaimWithRels> => {
      const { data, error } = await db
        .from("claims")
        .select(
          "*, customers(name,email,phone,address), carriers(name,email,phone), adjusters(name,email,phone)",
        )
        .eq("id", claimId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Claim not found");
      return data as ClaimWithRels;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: ClaimStatus) => {
      const { error } = await db.from("claims").update({ status }).eq("id", claimId);
      if (error) throw error;
      await logClaimEvent(claimId, "status_changed", `→ ${CLAIM_STATUS_LABEL[status]}`);
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["claim", claimId] });
      qc.invalidateQueries({ queryKey: ["claim-events", claimId] });
      qc.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async () => {
      const { error } = await db
        .from("claims")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", claimId);
      if (error) throw error;
      await logClaimEvent(claimId, "archived");
    },
    onSuccess: () => {
      toast.success("Archived");
      navigate({ to: "/app/claims" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <AppShell title="Claim">
        <LoadingList />
      </AppShell>
    );
  if (error || !claim)
    return (
      <AppShell title="Claim">
        <ErrorState message={(error as Error)?.message ?? "Not found"} onRetry={() => refetch()} />
        <div className="mt-4">
          <Button variant="ghost" asChild>
            <Link to="/app/claims">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to claims
            </Link>
          </Button>
        </div>
      </AppShell>
    );

  return (
    <AppShell title={claim.claim_number} subtitle={claim.customers?.name ?? "Unassigned"}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/claims">
              <ArrowLeft className="mr-2 h-4 w-4" /> Claims
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={claim.status}
              onValueChange={(v) => updateStatus.mutate(v as ClaimStatus)}
            >
              <SelectTrigger className="w-full sm:w-56" aria-label="Claim status">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => archive.mutate()}
              disabled={!!claim.archived_at}
            >
              <Archive className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
              {claim.archived_at ? "Archived" : "Archive"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="panel-atlas border-0">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount</p>
              <p className="font-display text-2xl mt-1 text-atlas-signal">
                {formatMoney(claim.amount_cents)}
              </p>
            </CardContent>
          </Card>
          <Card className="panel-atlas border-0">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Carrier</p>
              <p className="mt-1">{claim.carriers?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{claim.carriers?.email ?? ""}</p>
            </CardContent>
          </Card>
          <Card className="panel-atlas border-0">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Adjuster</p>
              <p className="mt-1">{claim.adjusters?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{claim.adjusters?.phone ?? ""}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analysis">
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <TabsList className="w-max min-w-full">
              <TabsTrigger value="analysis">
                <Brain className="mr-1 h-3 w-3" aria-hidden="true" /> Atlas Analysis
              </TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="mr-1 h-3 w-3" aria-hidden="true" /> Documents
              </TabsTrigger>
              <TabsTrigger value="photos">
                <ImageIcon className="mr-1 h-3 w-3" aria-hidden="true" /> Photos
              </TabsTrigger>
              <TabsTrigger value="supplements">
                <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" /> Supplements
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <CalIcon className="mr-1 h-3 w-3" aria-hidden="true" /> Appointments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analysis" className="mt-4">
            <AtlasAnalysis claimId={claimId} claimNumber={claim.claim_number} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <Timeline claimId={claimId} />
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <Notes claimId={claimId} />
          </TabsContent>
          <TabsContent value="comments" className="mt-4">
            <Comments claimId={claimId} />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <Documents claimId={claimId} />
          </TabsContent>
          <TabsContent value="photos" className="mt-4">
            <Photos claimId={claimId} />
          </TabsContent>
          <TabsContent value="supplements" className="mt-4">
            <Supplements claimId={claimId} />
          </TabsContent>
          <TabsContent value="appointments" className="mt-4">
            <Appointments claimId={claimId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ---------- Timeline ----------
function Timeline({ claimId }: { claimId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["claim-events", claimId],
    queryFn: async (): Promise<ClaimEvent[]> => {
      const { data, error } = await db
        .from("claim_events")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClaimEvent[];
    },
  });
  if (isLoading) return <LoadingList rows={3} />;
  if (!data?.length)
    return <EmptyState title="No activity yet" hint="Status changes and edits appear here." />;
  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {data.map((e) => (
            <div key={e.id} className="p-4">
              <p className="text-sm font-medium">{e.kind.replaceAll("_", " ")}</p>
              {e.detail && <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(e.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Notes ----------
function Notes({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["notes", claimId],
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await db
        .from("notes")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await db.from("notes").insert({ owner_id: uid, claim_id: claimId, body });
      if (error) throw error;
      await logClaimEvent(claimId, "note_added");
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["notes", claimId] });
      qc.invalidateQueries({ queryKey: ["claim-events", claimId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", claimId] }),
  });
  return (
    <div className="space-y-3">
      <Card className="panel-atlas border-0">
        <CardContent className="p-4 space-y-2">
          <Textarea
            placeholder="Add a note (internal)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => add.mutate()} disabled={!body.trim() || add.isPending}>
              Add note
            </Button>
          </div>
        </CardContent>
      </Card>
      {isLoading ? (
        <LoadingList rows={2} />
      ) : !data?.length ? (
        <EmptyState title="No notes" />
      ) : (
        <div className="grid gap-2">
          {data.map((n) => (
            <Card key={n.id} className="panel-atlas border-0">
              <CardContent className="p-4 flex justify-between gap-3">
                <div>
                  <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(n.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Comments ----------
function Comments({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const { data, isLoading } = useQuery({
    queryKey: ["comments", claimId],
    queryFn: async (): Promise<ClaimComment[]> => {
      const { data, error } = await db
        .from("claim_comments")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClaimComment[];
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await db
        .from("claim_comments")
        .insert({ owner_id: uid, claim_id: claimId, body, is_internal: isInternal });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", claimId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("claim_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", claimId] }),
  });
  return (
    <div className="space-y-3">
      <Card className="panel-atlas border-0">
        <CardContent className="p-4 space-y-2">
          <Textarea
            placeholder="Discuss with your team"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />{" "}
              Internal only
            </label>
            <Button size="sm" onClick={() => add.mutate()} disabled={!body.trim() || add.isPending}>
              Post
            </Button>
          </div>
        </CardContent>
      </Card>
      {isLoading ? (
        <LoadingList rows={2} />
      ) : !data?.length ? (
        <EmptyState title="No comments" />
      ) : (
        <div className="grid gap-2">
          {data.map((c) => (
            <Card key={c.id} className="panel-atlas border-0">
              <CardContent className="p-4 flex justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.is_internal ? "secondary" : "default"}>
                      {c.is_internal ? "Internal" : "External"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-1">{c.body}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Documents (claim-scoped) ----------
function Documents({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["claim-documents", claimId],
    queryFn: async (): Promise<AppDocument[]> => {
      const { data, error } = await db
        .from("documents")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AppDocument[];
    },
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      for (const f of Array.from(files)) {
        const meta = await uploadFile(DOC_BUCKET, f, `claims/${claimId}`);
        const { error } = await db.from("documents").insert({
          owner_id: uid,
          claim_id: claimId,
          folder: "Claim files",
          name: meta.name,
          storage_path: meta.path,
          mime_type: meta.type,
          size_bytes: meta.size,
        });
        if (error) throw error;
      }
      await logClaimEvent(claimId, "documents_uploaded", `${files.length} file(s)`);
    },
    onSuccess: () => {
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["claim-documents", claimId] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (d: AppDocument) => {
      if (d.storage_path) await deleteFile(DOC_BUCKET, d.storage_path).catch(() => {});
      const { error } = await db.from("documents").delete().eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["claim-documents", claimId] }),
  });

  async function open(d: AppDocument) {
    if (!d.storage_path) return;
    const url = await signedUrl(DOC_BUCKET, d.storage_path);
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-3">
      <Card className="panel-atlas border-0">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Upload PDFs, estimates, receipts, and photos.
          </p>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => e.target.files && upload.mutate(e.target.files)}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            <Upload className="mr-2 h-4 w-4" /> {upload.isPending ? "Uploading..." : "Upload"}
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <LoadingList rows={2} />
      ) : !data?.length ? (
        <EmptyState title="No documents" />
      ) : (
        <Card className="panel-atlas border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                  <button className="text-left min-w-0 flex-1" onClick={() => open(d)}>
                    <p className="text-sm truncate">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.mime_type ?? "file"} ·{" "}
                      {d.size_bytes ? Math.round(d.size_bytes / 1024) + " KB" : ""}
                    </p>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(d)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- Photos ----------
function Photos({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["claim-photos", claimId],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await db
        .from("photos")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Photo[];
    },
  });
  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      for (const f of Array.from(files)) {
        const meta = await uploadFile(PHOTO_BUCKET, f, `claims/${claimId}`);
        const { error } = await db
          .from("photos")
          .insert({ owner_id: uid, claim_id: claimId, storage_path: meta.path });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["claim-photos", claimId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (p: Photo) => {
      await deleteFile(PHOTO_BUCKET, p.storage_path).catch(() => {});
      const { error } = await db.from("photos").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["claim-photos", claimId] }),
  });

  return (
    <div className="space-y-3">
      <Card className="panel-atlas border-0">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Damage & job-site photos.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => e.target.files && upload.mutate(e.target.files)}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            <Upload className="mr-2 h-4 w-4" /> {upload.isPending ? "Uploading..." : "Add photos"}
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <LoadingList rows={2} />
      ) : !data?.length ? (
        <EmptyState title="No photos yet" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.map((p) => (
            <PhotoTile key={p.id} photo={p} onDelete={() => del.mutate(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
function PhotoTile({ photo, onDelete }: { photo: Photo; onDelete: () => void }) {
  const { data: url } = useQuery({
    queryKey: ["photo-url", photo.id, photo.storage_path],
    queryFn: () => signedUrl(PHOTO_BUCKET, photo.storage_path),
  });
  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-atlas-navy/40">
      {url ? (
        <img src={url} alt={photo.caption ?? "photo"} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse" />
      )}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ---------- Supplements (link) ----------
function Supplements({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["claim-supplements", claimId],
    queryFn: async (): Promise<Supplement[]> => {
      const { data, error } = await db
        .from("supplements")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Supplement[];
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { data, error } = await db
        .from("supplements")
        .insert({
          owner_id: uid,
          claim_id: claimId,
          status: "draft",
          summary: "",
          total_cents: 0,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["claim-supplements", claimId] });
      toast.success("Draft created");
      void s;
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
          New supplement
        </Button>
      </div>
      {isLoading ? (
        <LoadingList rows={2} />
      ) : !data?.length ? (
        <EmptyState title="No supplements yet" />
      ) : (
        <div className="grid gap-2">
          {data.map((s) => (
            <Link key={s.id} to="/app/supplements/$supplementId" params={{ supplementId: s.id }}>
              <Card className="panel-atlas border-0 hover:bg-white/5 transition">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          s.status === "approved"
                            ? "default"
                            : s.status === "denied"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {s.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-1">{s.summary || "Untitled draft"}</p>
                  </div>
                  <p className="font-mono text-atlas-signal">{formatMoney(s.total_cents)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Appointments ----------
function Appointments({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["claim-appointments", claimId],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await db
        .from("appointments")
        .select("*")
        .eq("claim_id", claimId)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await db.from("appointments").insert({
        owner_id: uid,
        claim_id: claimId,
        kind: "inspection",
        title,
        starts_at: new Date(when).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setWhen("");
      qc.invalidateQueries({ queryKey: ["claim-appointments", claimId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <Card className="panel-atlas border-0">
        <CardContent className="p-4 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-40">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inspection at property"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">When</label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <Button
            size="sm"
            onClick={() => add.mutate()}
            disabled={!title.trim() || !when || add.isPending}
          >
            Schedule
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <LoadingList rows={2} />
      ) : !data?.length ? (
        <EmptyState title="No appointments" />
      ) : (
        <Card className="panel-atlas border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data.map((a) => (
                <div key={a.id} className="p-4 flex justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.starts_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{a.kind}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
