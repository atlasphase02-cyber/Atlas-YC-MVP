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
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  db, currentUserId, formatMoney, logClaimEvent,
  uploadFile, signedUrl, deleteFile, DOC_BUCKET, PHOTO_BUCKET,
  CLAIM_STATUSES, CLAIM_STATUS_LABEL,
  type Claim, type ClaimStatus, type Note, type ClaimComment,
  type ClaimEvent, type AppDocument, type Photo, type Supplement, type Appointment,
} from "@/lib/atlas-db.ts";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  ArrowLeft, Trash2, Upload, MessageSquare, FileText, Image as ImageIcon,
  Calendar as CalIcon, Sparkles, Archive, Brain, MapPin, Phone, Mail,
  Building2, Shield, DollarSign, Camera, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

// ── New MVP components ──
import { ClaimWorkflow, type StageState, type WorkflowStage, STAGES } from "@/components/claim-workflow.tsx";
import {
  RevenueOpportunitiesPanel,
  type RevenueOpportunity,
} from "@/components/revenue-opportunities.tsx";
import { AIReasoningPanel, type ReasoningData } from "@/components/ai-reasoning-panel.tsx";
import { EvidencePanel, type EvidenceItem } from "@/components/evidence-panel.tsx";

export const Route = createFileRoute("/_authenticated/app/claims/$claimId")({ component: Page });

// ── Types ──
type ClaimWithRels = Claim & {
  customers: { name: string; email: string | null; phone: string | null; address: string | null; city?: string | null; state?: string | null; zip?: string | null } | null;
  carriers: { name: string; email: string | null; phone: string | null } | null;
  adjusters: { name: string; email: string | null; phone: string | null } | null;
};

// ── Compute workflow stage states from claim data ──
function computeWorkflow(claim: ClaimWithRels, docCount: number, photoCount: number, supplementCount: number, hasAnalysis: boolean): StageState[] {
  const now = claim.created_at;
  const stages: StageState[] = [];

  for (const s of STAGES) {
    let status: StageState["status"] = "pending";
    let completedAt: string | undefined;

    switch (s.key) {
      case "claim_created":
        status = "complete";
        completedAt = claim.created_at;
        break;
      case "documents_uploaded":
        if (docCount > 0) { status = "complete"; completedAt = now; }
        else if (stages[0]?.status === "complete") status = "active";
        break;
      case "photos_uploaded":
        if (photoCount > 0) { status = "complete"; completedAt = now; }
        else if (docCount > 0 && claim.status !== "new") status = "active";
        break;
      case "ai_analysis":
        if (hasAnalysis) { status = "complete"; completedAt = now; }
        else if (docCount > 0 || photoCount > 0) status = "active";
        break;
      case "revenue_opportunities":
        if (supplementCount > 0) { status = "complete"; completedAt = now; }
        else if (hasAnalysis) status = "active";
        break;
      case "compliance_validation":
        if (hasAnalysis && supplementCount > 0) status = "active";
        break;
      case "supplement_draft":
        if (supplementCount > 0) status = "active";
        break;
      case "export_package":
        break;
    }

    // If AI analysis ran, mark earlier stages complete
    if (hasAnalysis && ["claim_created", "documents_uploaded", "photos_uploaded", "ai_analysis"].includes(s.key)) {
      status = "complete";
    }

    stages.push({ key: s.key, status, completedAt });
  }

  return stages;
}

// ── Generate mock revenue opportunities from analysis ──
function buildOpportunities(analysis: Record<string, unknown> | null): RevenueOpportunity[] {
  if (!analysis) return [];
  const opps = (analysis.revenue_opportunities as Array<Record<string, unknown>>) ?? [];
  return opps.map((o, i) => ({
    id: `opp-${i}`,
    description: (o.description as string) ?? "Untitled",
    category: (o.category as string) ?? "scope",
    amount_cents: (o.amount_cents as number) ?? 0,
    confidence: (o.confidence as number) ?? 0,
    evidence_count: 3 + (i % 4),
    compliance_status: (["validated", "pending", "flagged"] as const)[i % 3],
    priority: (["high", "medium", "low"] as const)[i % 3],
    status: "new" as const,
    rationale: (o.rationale as string) ?? "",
    action: (o.action as string) ?? "",
    evidence_ids: [],
  }));
}

// ── Mock reasoning data for when user selects an opportunity ──
function buildReasoning(opp: RevenueOpportunity | null): ReasoningData | null {
  if (!opp) return null;
  return {
    summary: opp.description,
    confidence: opp.confidence,
    reasoning: opp.rationale || `Atlas identified this opportunity by comparing the carrier estimate against industry-standard scope for this type of loss. The carrier's estimate omitted line items that are standard for complete restoration based on the documented damage visible in uploaded photos and inspection notes.`,
    evidence: [
      { id: "ev-1", type: "photo", label: "Photo #14 — Missing ridge cap", detail: "Clear visual evidence of missing ridge cap on the north slope." },
      { id: "ev-2", type: "code", label: "IRC R905.2.7 — Ridge Cap", detail: "Manufacturer requires specific ridge cap installation for warranty." },
      { id: "ev-3", type: "estimate", label: "Carrier estimate comparison", detail: "Line item omitted from original estimate despite being visible in adjuster photos." },
      { id: "ev-4", type: "inspection", label: "Field inspection notes", detail: "Inspector noted 'ridge cap damaged/missing — replace per code'." },
    ],
    missingInformation: [
      "No close-up photo of ridge cap damage from south side",
      "Manufacturer warranty documentation not yet uploaded",
    ],
    possibleRisks: [
      "Adjuster may argue wear-and-tear rather than storm damage",
      "If carrier requires pre-approval for code upgrades, this may be delayed",
    ],
    requiredDocumentation: [
      "Close-up photos of ridge cap damage",
      "Manufacturer installation specification sheet",
      "IRC code reference printout",
    ],
    potentialAdjusterObjection: "Ridge cap is cosmetic — not required for waterproofing.",
    suggestedResponse: "Per IRC R905.2.7 and manufacturer GAF installation requirements, ridge cap is required for warranty coverage. Photo #14 clearly shows missing ridge cap exposing underlayment. This is a code-required item, not cosmetic.",
    estimatedRevenue: opp.amount_cents,
  };
}

function buildEvidence(opp: RevenueOpportunity | null): EvidenceItem[] {
  if (!opp) return [];
  return [
    { id: "ev-1", type: "photo", label: "Photo #14 — Ridge Cap", detail: "North slope ridge cap missing. Underlayment exposed.", date: "2026-01-15", connected_to: ["ev-2", "ev-3"] },
    { id: "ev-2", type: "code", label: "IRC R905.2.7", detail: "Roof covering application per manufacturer requirements.", connected_to: ["ev-1"] },
    { id: "ev-3", type: "estimate", label: "Carrier estimate — line 47", detail: "Ridge cap omitted. Compare with Xactimate line SFG 440.", connected_to: ["ev-1"] },
    { id: "ev-4", type: "inspection", label: "Field notes — Jan 14", detail: "\"Ridge cap damaged/missing on north elevation. Replace per code.\"", connected_to: ["ev-1"] },
    { id: "ev-5", type: "manufacturer", label: "GAF installation spec", detail: "Section 4.2 — Ridge cap required for warranty coverage.", connected_to: ["ev-2"] },
    { id: "ev-6", type: "measurement", label: "Roof measurement — north slope", detail: "42 linear feet ridge cap required.", connected_to: ["ev-1"] },
  ];
}

// ── Page ──
function Page() {
  const { claimId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: claim, isLoading, error, refetch } = useQuery({
    queryKey: ["claim", claimId],
    queryFn: async (): Promise<ClaimWithRels> => {
      const { data, error } = await db
        .from("claims")
        .select("*, customers(name,email,phone,address,city,state,zip), carriers(name,email,phone), adjusters(name,email,phone)")
        .eq("id", claimId).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Claim not found");
      return data as ClaimWithRels;
    },
  });

  const { data: docs } = useQuery({
    queryKey: ["claim-documents", claimId],
    queryFn: async () => { const { data } = await db.from("documents").select("id").eq("claim_id", claimId); return (data ?? []) as { id: string }[]; },
    enabled: !!claim,
  });

  const { data: photos } = useQuery({
    queryKey: ["claim-photos", claimId],
    queryFn: async () => { const { data } = await db.from("photos").select("id").eq("claim_id", claimId); return (data ?? []) as { id: string }[]; },
    enabled: !!claim,
  });

  const { data: supplements } = useQuery({
    queryKey: ["claim-supplements", claimId],
    queryFn: async () => { const { data } = await db.from("supplements").select("id").eq("claim_id", claimId); return (data ?? []) as { id: string }[]; },
    enabled: !!claim,
  });

  // Analysis state — stored in a local key (non-persistent for MVP)
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [oppStatuses, setOppStatuses] = useState<Record<string, "approved" | "rejected" | "edited">>({});

  const hasAnalysis = analysisData !== null;
  const workflow = computeWorkflow(claim!, docs?.length ?? 0, photos?.length ?? 0, supplements?.length ?? 0, hasAnalysis);
  const opportunities = buildOpportunities(analysisData).map((o) => ({
    ...o,
    status: oppStatuses[o.id] ?? o.status,
  }));
  const selectedOpp = opportunities.find((o) => o.id === selectedOppId) ?? null;
  const reasoning = buildReasoning(selectedOpp);
  const evidence = buildEvidence(selectedOpp);
  const totalRevenue = opportunities.filter((o) => o.status === "new").reduce((s, o) => s + o.amount_cents, 0);
  const approvedRevenue = opportunities.filter((o) => o.status === "approved").reduce((s, o) => s + o.amount_cents, 0);

  // Handle AtlasAnalysis completion — called from the Analysis tab
  const handleAnalysisComplete = (data: Record<string, unknown>) => {
    setAnalysisData(data);
    qc.invalidateQueries({ queryKey: ["claim-supplements", claimId] });
  };

  const updateStatus = useMutation({
    mutationFn: async (status: ClaimStatus) => {
      const { error } = await db.from("claims").update({ status }).eq("id", claimId);
      if (error) throw error;
      await logClaimEvent(claimId, "status_changed", `→ ${CLAIM_STATUS_LABEL[status]}`);
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["claim", claimId] });
      qc.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("claims").update({ archived_at: new Date().toISOString() }).eq("id", claimId);
      if (error) throw error;
      await logClaimEvent(claimId, "archived");
    },
    onSuccess: () => { toast.success("Archived"); navigate({ to: "/app/claims" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <AppShell title="Claim"><LoadingList /></AppShell>;
  if (error || !claim) return (
    <AppShell title="Claim">
      <ErrorState message={(error as Error)?.message ?? "Not found"} onRetry={() => refetch()} />
      <div className="mt-4"><Button variant="ghost" asChild><Link to="/app/claims"><ArrowLeft className="mr-2 h-4 w-4" /> Back to claims</Link></Button></div>
    </AppShell>
  );

  const handleApprove = (id: string) => {
    setOppStatuses((p) => ({ ...p, [id]: "approved" }));
    toast.success("Opportunity approved");
  };
  const handleReject = (id: string) => {
    setOppStatuses((p) => ({ ...p, [id]: "rejected" }));
    toast.success("Opportunity rejected");
  };
  const handleEdit = (id: string) => {
    setOppStatuses((p) => ({ ...p, [id]: "edited" }));
  };
  const handleAskAI = (id: string) => {
    setSelectedOppId(id);
    const question = `Explain why ${opportunities.find((o) => o.id === id)?.description ?? "this recommendation"} is valid`;
    window.dispatchEvent(new CustomEvent("atlas:ask", { detail: { prompt: question } }));
  };

  return (
    <AppShell title={claim.claim_number} subtitle={claim.customers?.name ?? "Unassigned"}>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/claims"><ArrowLeft className="mr-2 h-4 w-4" /> Claims</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={claim.status} onValueChange={(v) => updateStatus.mutate(v as ClaimStatus)}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLAIM_STATUSES.map((s) => (<SelectItem key={s} value={s}>{CLAIM_STATUS_LABEL[s]}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => archive.mutate()} disabled={!!claim.archived_at}>
              <Archive className="mr-2 h-4 w-4" />{claim.archived_at ? "Archived" : "Archive"}
            </Button>
          </div>
        </div>

        {/* ── Workflow Table ── */}
        <ClaimWorkflow stages={workflow} />

        {/* ── Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN — Claim info, documents, photos, notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <StatCard label="Amount" value={formatMoney(claim.amount_cents)} tone="signal" />
              <StatCard label="Carrier" value={claim.carriers?.name ?? "—"} tone="default" />
              <StatCard label="Adjuster" value={claim.adjusters?.name ?? "—"} tone="default" />
              <StatCard label="Status" value={CLAIM_STATUS_LABEL[claim.status]} tone="default" />
            </div>

            {/* Customer & Property Info */}
            {claim.customers && (
              <Card className="panel-atlas border-0">
                <CardContent className="p-5">
                  <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Customer &amp; Property
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{claim.customers.name}</p>
                    </div>
                    {claim.customers.email && (
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{claim.customers.email}</p>
                      </div>
                    )}
                    {claim.customers.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{claim.customers.phone}</p>
                      </div>
                    )}
                    {(claim.customers.address || claim.customers.city) && (
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{[claim.customers.address, claim.customers.city, claim.customers.state, claim.customers.zip].filter(Boolean).join(", ")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Claim Info */}
            <Card className="panel-atlas border-0">
              <CardContent className="p-5">
                <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Claim Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Claim #</p><p className="font-mono text-atlas-cyan">{claim.claim_number}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={claim.status === "approved" ? "default" : claim.status === "denied" ? "destructive" : "secondary"}>{CLAIM_STATUS_LABEL[claim.status]}</Badge></div>
                  {claim.loss_date && <div><p className="text-xs text-muted-foreground">Date of Loss</p><p>{new Date(claim.loss_date).toLocaleDateString()}</p></div>}
                  <div><p className="text-xs text-muted-foreground">Carrier</p><p>{claim.carriers?.name ?? "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Adjuster</p><p>{claim.adjusters?.name ?? "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Claim Value</p><p className="font-mono text-atlas-signal">{formatMoney(claim.amount_cents)}</p></div>
                </div>
                {claim.description && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{claim.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Atlas Analysis — the AI engine */}
            <AtlasAnalysisInline claimId={claimId} claimNumber={claim.claim_number} onComplete={handleAnalysisComplete} />

            {/* Timeline */}
            <TimelineInline claimId={claimId} />

            {/* Notes */}
            <NotesInline claimId={claimId} />
          </div>

          {/* RIGHT COLUMN — Atlas AI Panel */}
          <div className="space-y-6">
            {/* Revenue at risk summary */}
            <Card className="panel-atlas border-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-display text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-atlas-signal" />
                  Atlas AI Panel
                </h3>
                {hasAnalysis && (
                  <Badge variant="outline" className="text-[10px] border-atlas-signal/30 text-atlas-signal">
                    {(analysisData?.confidence as number) ?? 0}% confidence
                  </Badge>
                )}
              </div>
              <CardContent className="p-5 space-y-4">
                {!hasAnalysis ? (
                  <div className="text-center py-6">
                    <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Run the AI analysis below to discover revenue opportunities.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Revenue totals */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-atlas-signal/5 border border-atlas-signal/15 p-3 text-center">
                        <p className="text-2xl font-display text-atlas-signal">{formatMoney(totalRevenue)}</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Available</p>
                      </div>
                      <div className="rounded-xl bg-atlas-cyan/5 border border-atlas-cyan/15 p-3 text-center">
                        <p className="text-2xl font-display text-atlas-cyan">{formatMoney(approvedRevenue)}</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Approved</p>
                      </div>
                    </div>

                    {/* Quick insight */}
                    <p className="text-xs text-muted-foreground">
                      {opportunities.filter((o) => o.status === "new").length} opportunities awaiting your review.
                      {opportunities.some((o) => o.priority === "high") && " High-priority items need attention."}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Revenue Opportunities — compact */}
            {hasAnalysis && opportunities.length > 0 && (
              <RevenueOpportunitiesPanel
                opportunities={opportunities}
                totalRevenue={totalRevenue}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onAskAI={handleAskAI}
                onViewEvidence={(id) => { setSelectedOppId(id); setShowEvidence(true); }}
                selectedId={selectedOppId}
                onSelect={(id) => { setSelectedOppId(id); setShowEvidence(false); }}
              />
            )}

            {/* Evidence Panel or AI Reasoning — toggle */}
            {selectedOppId && showEvidence && (
              <EvidencePanel items={evidence} onClose={() => setShowEvidence(false)} onItemClick={() => {}} />
            )}

            {selectedOppId && !showEvidence && (
              <AIReasoningPanel
                data={reasoning}
                onAskFollowUp={(q) => window.dispatchEvent(new CustomEvent("atlas:ask", { detail: { prompt: q } }))}
              />
            )}

            {/* Compliance status */}
            {hasAnalysis && (
              <Card className="panel-atlas border-0">
                <CardContent className="p-5">
                  <h3 className="font-display text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Compliance
                  </h3>
                  <div className="space-y-2 text-sm">
                    {((analysisData?.compliance_checks as Array<Record<string, unknown>>) ?? []).slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">{c.description as string}</span>
                        <Badge variant={c.status === "pass" ? "default" : c.status === "fail" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                          {c.status as string}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export button */}
            {opportunities.filter((o) => o.status === "approved").length > 0 && (
              <Button className="w-full gap-2" size="lg">
                <FileText className="h-4 w-4" />
                Export Supplement Package
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Stat Card ──
function StatCard({ label, value, tone }: { label: string; value: string; tone: "default" | "signal" }) {
  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn("font-display text-xl mt-1 truncate", tone === "signal" && "text-atlas-signal")}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Inline Atlas Analysis (simplified — delegates to server fn) ──
import { useServerFn } from "@tanstack/react-start";
import { analyzeClaim, type ClaimAnalysis } from "@/lib/atlas-reasoning.functions.ts";
import { Progress } from "@/components/ui/progress.tsx";
import { Loader2, Brain as BrainIcon, CheckCircle2, AlertTriangle } from "lucide-react";

function AtlasAnalysisInline({
  claimId,
  claimNumber,
  onComplete,
}: {
  claimId: string;
  claimNumber: string;
  onComplete: (data: Record<string, unknown>) => void;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const runAnalysis = useServerFn(analyzeClaim);

  const handleRun = async () => {
    setRunning(true);
    setErr(null);
    const phases = [
      { pct: 10, text: "Scanning claim record…" },
      { pct: 25, text: "Reading documents and photos…" },
      { pct: 45, text: "Cross-referencing evidence…" },
      { pct: 65, text: "Validating building codes…" },
      { pct: 80, text: "Detecting revenue opportunities…" },
      { pct: 95, text: "Synthesizing analysis…" },
    ];
    for (const ph of phases) {
      setProgress(ph.pct);
      setPhaseText(ph.text);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    }
    try {
      const result = await runAnalysis({ data: { claimId } });
      setProgress(100);
      setPhaseText("Analysis complete");
      setRunning(false);
      onComplete(result as unknown as Record<string, unknown>);
    } catch (e) {
      setErr((e as Error).message);
      setRunning(false);
    }
  };

  if (err) {
    return (
      <Card className="panel-atlas border-0 border-destructive/30">
        <CardContent className="p-5 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">Analysis failed</p>
          <p className="text-xs text-muted-foreground mt-1">{err}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleRun}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (running) {
    return (
      <Card className="panel-atlas border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-atlas-cyan animate-spin" />
            <span className="font-display text-sm text-atlas-cyan">{phaseText}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </CardContent>
      </Card>
    );
  }

  // If not yet run
  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-atlas-cyan/20 to-atlas-violet/20 flex items-center justify-center mb-3">
          <BrainIcon className="h-6 w-6 text-atlas-cyan" />
        </div>
        <h3 className="font-display text-base mb-1">Atlas Claim Analysis</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Atlas will analyze {claimNumber} — connecting evidence, validating compliance, and detecting missing revenue.
        </p>
        <Button onClick={handleRun} className="gap-2">
          <Sparkles className="h-4 w-4" /> Analyze Claim
        </Button>
        <p className="text-[10px] text-muted-foreground mt-2">Takes ~7 seconds</p>
      </CardContent>
    </Card>
  );
}

// ── Inline Timeline ──
function TimelineInline({ claimId }: { claimId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["claim-events", claimId],
    queryFn: async (): Promise<ClaimEvent[]> => {
      const { data, error } = await db.from("claim_events").select("*").eq("claim_id", claimId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClaimEvent[];
    },
  });
  if (isLoading) return <LoadingList rows={2} />;
  if (!data?.length) return null;

  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-5">
        <h3 className="font-display text-sm mb-3">Activity Timeline</h3>
        <div className="space-y-2">
          {data.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-start gap-3 text-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-atlas-cyan mt-2 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="text-sm">{e.kind.replaceAll("_", " ")}</p>
                {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Inline Notes ──
function NotesInline({ claimId }: { claimId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["notes", claimId],
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await db.from("notes").select("*").eq("claim_id", claimId).order("created_at", { ascending: false });
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
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["notes", claimId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await db.from("notes").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", claimId] }),
  });

  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-5">
        <h3 className="font-display text-sm mb-3">Notes</h3>
        <div className="space-y-2 mb-3">
          <Textarea placeholder="Add an internal note..." value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => add.mutate()} disabled={!body.trim() || add.isPending}>Add note</Button>
          </div>
        </div>
        {isLoading ? <LoadingList rows={2} /> : !data?.length ? (
          <p className="text-xs text-muted-foreground">No notes yet.</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 5).map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-white/[0.03] flex justify-between gap-2 group">
                <div>
                  <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => del.mutate(n.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
