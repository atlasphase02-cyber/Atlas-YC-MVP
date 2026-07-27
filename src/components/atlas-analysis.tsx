import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  analyzeClaim,
  decomposeConfidence,
  type ClaimAnalysis,
  type EvidenceNode,
  type EvidenceEdge,
  type ComplianceCheck,
  type RevenueOpportunity,
  type ConfidenceFactor,
} from "@/lib/atlas-reasoning.functions.ts";
import { formatMoney } from "@/lib/atlas-db.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Shield,
  DollarSign,
  Network,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Brain,
  ChevronRight,
  Loader2,
  ArrowRight,
  FileDown,
  Gauge,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Phase =
  "idle" | "gathering" | "evidence" | "compliance" | "revenue" | "synthesizing" | "complete";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const NARRATION_MAP: Record<Phase, string[]> = {
  idle: [],
  gathering: [
    "Scanning claim record…",
    "Pulling customer & carrier details…",
    "Retrieving photos, documents, notes…",
    "Found 12 claim artifacts.",
  ],
  evidence: [
    "Reading inspection notes…",
    "Cross-referencing photos with scope…",
    "Linking evidence to conclusions…",
    "Building evidence graph…",
  ],
  compliance: [
    "Loading IRC building code database…",
    "Checking carrier documentation requirements…",
    "Validating moisture readings against code…",
    "Cross-checking adjuster guidelines…",
  ],
  revenue: [
    "Scanning for scope gaps…",
    "Checking code-required items against estimate…",
    "Comparing against carrier-allowable items…",
    "Matching against historical claims…",
    "Detecting legitimate recoverable revenue…",
  ],
  synthesizing: [
    "Weighing confidence factors…",
    "Generating carrier-specific intelligence…",
    "Calibrating recommendations…",
    "Final confidence check…",
  ],
  complete: [],
};

export function AtlasAnalysis({ claimId, claimNumber }: { claimId: string; claimNumber: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [narrationIdx, setNarrationIdx] = useState(0);
  const narration = NARRATION_MAP[phase] ?? [];

  useEffect(() => {
    if (phase === "idle" || phase === "complete" || narration.length === 0) {
      setNarrationIdx(0);
      return;
    }
    setNarrationIdx(0);
    const timers: number[] = [];
    narration.forEach((_, i) => {
      timers.push(window.setTimeout(() => setNarrationIdx(i + 1), i * 900 + 300));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const runAnalysis = useServerFn(analyzeClaim);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["atlas-analysis", claimId],
    queryFn: async (): Promise<ClaimAnalysis> => {
      setPhase("gathering");
      setProgress(10);
      await sleep(1200);
      setPhase("evidence");
      setProgress(30);
      await sleep(1200);
      setPhase("compliance");
      setProgress(55);
      await sleep(1200);
      setPhase("revenue");
      setProgress(75);
      await sleep(1500);
      setPhase("synthesizing");
      setProgress(90);
      const result = await runAnalysis({ data: { claimId } });
      setPhase("complete");
      setProgress(100);
      return result;
    },
    enabled: false,
    staleTime: 300_000,
  });

  if (phase === "idle") {
    return (
      <Card className="panel-atlas border-0 overflow-hidden">
        <div className="relative p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-atlas-cyan/20 to-atlas-violet/20 flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-atlas-cyan" />
          </div>
          <h3 className="font-display text-xl mb-2">Atlas Claim Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Atlas will analyze {claimNumber} end-to-end — connecting evidence, validating
            compliance, detecting missing revenue, and explaining every recommendation.
          </p>
          <Button onClick={() => refetch()} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" /> Analyze Claim
          </Button>
          <p className="text-[11px] text-muted-foreground mt-3">Takes about 30 seconds</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="panel-atlas border-0 overflow-hidden">
      <CardContent className="p-6">
        {phase !== "complete" && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 text-atlas-cyan animate-spin" />
              <span className="font-display text-sm text-atlas-cyan uppercase tracking-wider">
                {phase === "gathering" && "Gathering claim context…"}
                {phase === "evidence" && "Building evidence graph…"}
                {phase === "compliance" && "Validating building codes…"}
                {phase === "revenue" && "Detecting revenue opportunities…"}
                {phase === "synthesizing" && "Synthesizing analysis…"}
              </span>
            </div>
            <Progress value={progress} className="h-1.5 mb-3" />
            {narration.slice(0, narrationIdx).map((line, i) => (
              <p key={i} className="text-[12px] text-muted-foreground animate-fade-in ml-8 mt-1">
                {line}
              </p>
            ))}
          </div>
        )}
        {error && (
          <div className="text-center py-6">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Analysis failed</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}
        {data && phase === "complete" && (
          <AnalysisResult data={data} claimId={claimId} claimNumber={claimNumber} />
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisResult({
  data,
  claimId,
  claimNumber,
}: {
  data: ClaimAnalysis;
  claimId: string;
  claimNumber: string;
}) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [deliverableReady, setDeliverableReady] = useState(false);
  const totalRevenue = data.revenue_opportunities.reduce((s, o) => s + o.amount_cents, 0);
  const passCount = data.compliance_checks.filter((c) => c.status === "pass").length;
  const failCount = data.compliance_checks.filter((c) => c.status === "fail").length;

  // Dramatic reveal sequence: confidence, then REVENUE (big beat), then meter, then rest
  useEffect(() => {
    const sequence = [
      { id: "confidence", delay: 300 },
      { id: "revenue", delay: 1200 },
      { id: "meter", delay: 2000 },
      { id: "evidence", delay: 2500 },
      { id: "compliance", delay: 2900 },
      { id: "carrier", delay: 3300 },
      { id: "risks", delay: 3700 },
      { id: "recs", delay: 4100 },
      { id: "deliverable", delay: 4800 },
    ];
    const timers = sequence.map((s) =>
      setTimeout(() => setRevealed((p) => new Set([...p, s.id])), s.delay),
    );
    timers.push(setTimeout(() => setDeliverableReady(true), 5500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-5">
      {/* 1. Confidence header */}
      <div
        className={cn(
          "transition-all duration-700",
          revealed.has("confidence") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg">{claimNumber} — Analysis complete</p>
            <p className="text-sm text-muted-foreground mt-0.5">{data.summary}</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-3xl font-display text-atlas-signal">{data.confidence}%</div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Confidence
            </p>
          </div>
        </div>
      </div>

      {/* 2. Revenue — the big beat */}
      {data.revenue_opportunities.length > 0 && (
        <Section
          reveal={revealed.has("revenue")}
          icon={<DollarSign className="h-4 w-4" />}
          title="Revenue Opportunities"
          accent="emerald"
        >
          <div className="space-y-3">
            {data.revenue_opportunities.map((o) => (
              <RevenueCard key={o.id} opp={o} />
            ))}
            <p className="text-right font-display text-2xl text-emerald-400 animate-pulse">
              {formatMoney(totalRevenue)} Recoverable Revenue Identified
            </p>
          </div>
        </Section>
      )}

      {/* 3. Confidence Meter */}
      <ConfidenceMeter
        reveal={revealed.has("meter")}
        confidence={data.confidence}
        summary={data.summary}
        evidenceCount={data.evidence_graph.nodes.length}
        compliancePass={passCount}
        complianceFail={failCount}
        revenueCount={data.revenue_opportunities.length}
        revenueTotal={totalRevenue}
      />

      {/* 4. Evidence Graph */}
      {data.evidence_graph.nodes.length > 0 && (
        <Section
          reveal={revealed.has("evidence")}
          icon={<Network className="h-4 w-4" />}
          title="Evidence Graph"
          accent="sky"
        >
          <EvidenceGraph nodes={data.evidence_graph.nodes} edges={data.evidence_graph.edges} />
        </Section>
      )}

      {/* 5. Compliance */}
      {data.compliance_checks.length > 0 && (
        <Section
          reveal={revealed.has("compliance")}
          icon={<Shield className="h-4 w-4" />}
          title="Compliance Validation"
          accent="violet"
        >
          <div className="space-y-2">
            {data.compliance_checks.map((c) => (
              <ComplianceRow key={c.id} check={c} />
            ))}
          </div>
        </Section>
      )}

      {/* 6. Carrier Intelligence */}
      {data.carrier_insights && (
        <Section
          reveal={revealed.has("carrier")}
          icon={<Brain className="h-4 w-4" />}
          title="Carrier Intelligence"
          accent="amber"
        >
          <p className="text-sm">{data.carrier_insights}</p>
        </Section>
      )}

      {/* 7. Risk Flags */}
      {data.risk_flags.length > 0 && (
        <Section
          reveal={revealed.has("risks")}
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Risk Flags"
          accent="red"
        >
          <ul className="space-y-1.5">
            {data.risk_flags.map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 8. Recommendations */}
      {data.recommendations.length > 0 && (
        <Section
          reveal={revealed.has("recs")}
          icon={<Sparkles className="h-4 w-4" />}
          title="Atlas Recommends"
          accent="emerald"
        >
          <ol className="space-y-2 list-decimal list-inside">
            {data.recommendations.map((r, i) => (
              <li key={i} className="text-sm pl-1">
                {r}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* 9. Deliverable — Supplement Package */}
      <DeliverableSection reveal={revealed.has("deliverable")} ready={deliverableReady} />
    </div>
  );
}

function ConfidenceMeter({
  reveal,
  confidence,
  summary,
  evidenceCount,
  compliancePass,
  complianceFail,
  revenueCount,
  revenueTotal,
}: {
  reveal: boolean;
  confidence: number;
  summary: string;
  evidenceCount: number;
  compliancePass: number;
  complianceFail: number;
  revenueCount: number;
  revenueTotal: number;
}) {
  const runDecompose = useServerFn(decomposeConfidence);
  const { data: decomp } = useQuery({
    queryKey: ["confidence-decomp", confidence, evidenceCount],
    queryFn: async () => {
      return runDecompose({
        data: {
          confidence,
          summary,
          evidence_count: evidenceCount,
          compliance_pass: compliancePass,
          compliance_fail: complianceFail,
          revenue_count: revenueCount,
          revenue_total_cents: revenueTotal,
        },
      });
    },
    enabled: reveal,
    staleTime: 600_000,
  });

  const factors = decomp?.factors ?? [];
  const positiveFactors = factors.filter((f) => f.impact >= 0);
  const negativeFactors = factors.filter((f) => f.impact < 0);
  const maxImpact = Math.max(...factors.map((f) => Math.abs(f.impact)), 1);

  return (
    <div
      className={cn(
        "border-l-2 border-l-amber-500 bg-amber-500/5 rounded-r-lg p-4 transition-all duration-700",
        reveal ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="h-4 w-4 text-amber-400" />
        <h4 className="font-display text-sm uppercase tracking-wider">Confidence Breakdown</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {decomp?.summary ?? "Loading confidence factors…"}
      </p>

      {/* Positive factors */}
      {positiveFactors.length > 0 && (
        <div className="space-y-2 mb-3">
          {positiveFactors.map((f, i) => (
            <FactorBar key={`pos-${i}`} factor={f} maxImpact={maxImpact} />
          ))}
        </div>
      )}

      {/* Negative factors */}
      {negativeFactors.length > 0 && (
        <div className="space-y-2">
          {negativeFactors.map((f, i) => (
            <FactorBar key={`neg-${i}`} factor={f} maxImpact={maxImpact} />
          ))}
        </div>
      )}

      {factors.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Computing confidence factors…
        </div>
      )}
    </div>
  );
}

function FactorBar({ factor, maxImpact }: { factor: ConfidenceFactor; maxImpact: number }) {
  const isPositive = factor.impact >= 0;
  const widthPct = maxImpact > 0 ? (Math.abs(factor.impact) / maxImpact) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-24 text-right shrink-0 text-muted-foreground">{factor.label}</span>
      <div className="flex-1 h-5 rounded-full bg-white/5 relative overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            isPositive ? "bg-emerald-500/60" : "bg-destructive/60",
          )}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs w-10 font-mono shrink-0",
          isPositive ? "text-emerald-400" : "text-destructive",
        )}
      >
        {isPositive ? "+" : ""}
        {factor.impact}%
      </span>
    </div>
  );
}

function DeliverableSection({ reveal, ready }: { reveal: boolean; ready: boolean }) {
  return (
    <div
      className={cn(
        "border-l-2 border-l-atlas-cyan bg-atlas-cyan/5 rounded-r-lg p-4 transition-all duration-700",
        reveal ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <FileDown className="h-4 w-4 text-atlas-cyan" />
        <h4 className="font-display text-sm uppercase tracking-wider">Supplement Package Ready</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Atlas has produced a complete supplement package — defensible, evidence-backed, and ready
        for submission.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <PackageCard
          icon={<FileText className="h-4 w-4" />}
          label="Executive Summary"
          desc="Overview of findings, revenue impact, and confidence."
          ready={ready}
        />
        <PackageCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Revenue Breakdown"
          desc="Line-item analysis with amounts and confidence per item."
          ready={ready}
        />
        <PackageCard
          icon={<Network className="h-4 w-4" />}
          label="Supporting Evidence"
          desc="Evidence graph with photo-to-conclusion mapping."
          ready={ready}
        />
        <PackageCard
          icon={<Shield className="h-4 w-4" />}
          label="Code References"
          desc="IRC/IBC sections with pass/fail status and citations."
          ready={ready}
        />
        <PackageCard
          icon={<Brain className="h-4 w-4" />}
          label="Carrier Notes"
          desc="Carrier-specific guidance and historical patterns."
          ready={ready}
        />
        <PackageCard
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Human Review Checklist"
          desc="Final verification steps before supplement submission."
          ready={ready}
          isLast
        />
      </div>
    </div>
  );
}

function PackageCard({
  icon,
  label,
  desc,
  ready,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  ready: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-300",
        ready ? "border-atlas-cyan/30 bg-atlas-cyan/5" : "",
        isLast && ready ? "ring-1 ring-atlas-cyan/40" : "",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-muted-foreground", ready && "text-atlas-cyan")}>{icon}</span>
        <span className="text-xs font-medium">{label}</span>
        {ready && <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-auto" />}
        {!ready && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
            generating
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function Section({
  reveal,
  icon,
  title,
  accent,
  children,
}: {
  reveal: boolean;
  icon: React.ReactNode;
  title: string;
  accent: "violet" | "emerald" | "sky" | "amber" | "red";
  children: React.ReactNode;
}) {
  const borderMap = {
    violet: "border-l-atlas-violet",
    emerald: "border-l-emerald-500",
    sky: "border-l-atlas-cyan",
    amber: "border-l-amber-500",
    red: "border-l-destructive",
  };
  const bgMap = {
    violet: "bg-atlas-violet/5",
    emerald: "bg-emerald-500/5",
    sky: "bg-atlas-cyan/5",
    amber: "bg-amber-500/5",
    red: "bg-destructive/5",
  };
  return (
    <div
      className={cn(
        "border-l-2 rounded-r-lg p-4 transition-all duration-700",
        borderMap[accent],
        bgMap[accent],
        reveal ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <h4 className="font-display text-sm uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function RevenueCard({ opp }: { opp: RevenueOpportunity }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{opp.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{opp.rationale}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px]">
            {opp.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> {opp.action}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-lg text-emerald-500 font-semibold">
          {formatMoney(opp.amount_cents)}
        </p>
        <p className="text-[10px] text-muted-foreground">{opp.confidence}% confidence</p>
      </div>
    </div>
  );
}

function ComplianceRow({ check }: { check: ComplianceCheck }) {
  const icon =
    check.status === "pass" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : check.status === "fail" ? (
      <XCircle className="h-4 w-4 text-destructive" />
    ) : (
      <HelpCircle className="h-4 w-4 text-amber-500" />
    );
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-atlas-cyan">{check.code}</span>
          <Badge
            variant={
              check.status === "pass"
                ? "secondary"
                : check.status === "fail"
                  ? "destructive"
                  : "outline"
            }
            className="text-[10px]"
          >
            {check.status === "pass"
              ? "Pass"
              : check.status === "fail"
                ? "Fail"
                : "Insufficient data"}
          </Badge>
        </div>
        <p className="text-sm mt-0.5">{check.description}</p>
        {check.remediation && (
          <p className="text-xs text-amber-400 mt-1">Fix: {check.remediation}</p>
        )}
      </div>
    </div>
  );
}

function EvidenceGraph({ nodes, edges }: { nodes: EvidenceNode[]; edges: EvidenceEdge[] }) {
  const typeConfig: Record<string, { color: string; label: string }> = {
    photo: { color: "border-sky-500 bg-sky-500/10", label: "Photo" },
    document: { color: "border-violet-500 bg-violet-500/10", label: "Doc" },
    note: { color: "border-amber-500 bg-amber-500/10", label: "Note" },
    estimate: { color: "border-emerald-500 bg-emerald-500/10", label: "Estimate" },
    moisture: { color: "border-blue-500 bg-blue-500/10", label: "Moisture" },
    code: { color: "border-red-500 bg-red-500/10", label: "Code" },
    carrier: { color: "border-pink-500 bg-pink-500/10", label: "Carrier" },
    historical: { color: "border-slate-500 bg-slate-500/10", label: "Historical" },
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {nodes.map((n) => {
          const c = typeConfig[n.type] ?? typeConfig.document;
          const connected = edges.some((e) => e.from === n.id || e.to === n.id);
          return (
            <div
              key={n.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs transition-all",
                c.color,
                connected && "ring-1 ring-white/20",
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.label}
              </span>
              <p className="font-medium mt-0.5">{n.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.detail}</p>
            </div>
          );
        })}
      </div>
      {edges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {edges.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-white/5 rounded-full px-2.5 py-1"
            >
              <span className="font-mono text-atlas-cyan">{e.from.slice(0, 6)}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="italic">{e.relation}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-mono text-atlas-cyan">{e.to.slice(0, 6)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
