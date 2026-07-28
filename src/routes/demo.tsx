import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Brain, ShieldCheck, DollarSign, Camera, FileText, CheckCircle2,
  XCircle, ChevronRight, ChevronDown, ArrowRight, ArrowLeft, Upload, Clock,
  TrendingUp, AlertCircle, Network, Zap, FileDown, X, Link2, FolderOpen,
  Building2, MapPin, Phone, Mail, Edit3, MessageSquare, Loader2, Check
} from "lucide-react";
import {
  DEMO_CLAIM, DEMO_EVIDENCE, DEMO_FINDINGS, DEMO_OPPORTUNITIES,
  DEMO_TIMELINE, DEMO_SESSION_LOGS, AI_THINKING_STREAM, DEMO_METRICS,
  formatMoney,
  type DemoOpportunity, type DemoEvidence, type DemoFinding,
} from "@/lib/demo-data.ts";
import { cn } from "@/lib/utils.ts";

export const Route = createFileRoute("/demo")({ component: DemoPage });

// ── Motion variants ──
const fadeUp = {
  start: { opacity: 1 },
  end: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] as const } },
};
const stagger = {
  start: { opacity: 1 },
  end: { transition: { staggerChildren: 0.06 } },
};
const scaleIn = {
  start: { opacity: 1 },
  end: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] as const } },
};

// ── Demo phase tracking ──
type DemoPhase = "auth" | "dashboard" | "claim" | "complete";
type OppAction = "approved" | "rejected" | "edited" | null;

function DemoPage() {
  const [phase, setPhase] = useState<DemoPhase>("auth");

  return (
    <div className="min-h-dvh bg-atmosphere text-foreground font-sans">
      {phase === "auth" && <AuthScreen onLogin={() => setPhase("dashboard")} />}
      {phase === "dashboard" && <Dashboard onContinue={() => setPhase("claim")} />}
      {phase === "claim" && (
        <ClaimWorkspace onBack={() => setPhase("dashboard")} onComplete={() => setPhase("complete")} />
      )}
      {phase === "complete" && <DemoComplete onReturn={() => setPhase("dashboard")} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// 1. AUTH SCREEN
// ─────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("sarah.mitchell@summitrestoration.com");
  const [password, setPassword] = useState("••••••••••");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(onLogin, 1200);
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center px-4 overflow-hidden">
      {/* Animated grid bg */}
      <div className="absolute inset-0 bg-grid-atlas opacity-30" />
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--atlas-cyan) 20%, transparent) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 right-10 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--atlas-violet) 15%, transparent) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div initial={{ opacity: 1, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="relative w-full max-w-md">
        <div className="panel-atlas rounded-2xl p-8 glow-cyan">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-atlas-cyan/30 to-atlas-violet/30 flex items-center justify-center mb-3">
              <Brain className="h-7 w-7 text-atlas-cyan" />
            </div>
            <h1 className="font-display text-2xl text-gradient-atlas">ATLAS</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
              Recover Every Dollar You're Owed
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-atlas-cyan/50 focus:border-atlas-cyan/30 transition"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-atlas-cyan/50 focus:border-atlas-cyan/30 transition"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" defaultChecked className="rounded border-border" />
                Remember me
              </label>
              <span className="text-atlas-cyan cursor-pointer">Forgot password?</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-atlas-cyan to-atlas-cyan-soft text-atlas-void font-semibold py-2.5 text-sm transition-all hover:shadow-[0_0_30px_-5px_var(--atlas-cyan)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Atlas
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            Demo mode — no credentials needed. Click sign in.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Dashboard" subtitle="Here's where the business stands right now." />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Atlas Summary */}
            <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="panel-atlas rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-atlas-cyan/20 to-atlas-violet/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-atlas-cyan" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Atlas Summary</p>
                    <p className="text-lg font-display">
                      Good afternoon, Sarah. You have{" "}
                      <span className="text-atlas-signal">3 claims</span> requiring review and{" "}
                      <span className="text-atlas-cyan">{DEMO_METRICS.opportunitiesAvailable} revenue opportunities</span>{" "}
                      worth <span className="text-atlas-signal">{formatMoney(DEMO_METRICS.potentialRevenue)}</span> waiting for approval.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* KPI Grid */}
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Recovered Revenue" value={formatMoney(DEMO_METRICS.recoveredRevenue)} trend="+12% this month" icon={TrendingUp} tone="signal" />
              <KpiCard label="Potential Revenue" value={formatMoney(DEMO_METRICS.potentialRevenue)} trend={`${DEMO_METRICS.claimsInReview} claims in review`} icon={DollarSign} tone="cyan" />
              <KpiCard label="Approval Rate" value={`${DEMO_METRICS.approvalRate}%`} trend="Above industry avg" icon={CheckCircle2} tone="signal" />
              <KpiCard label="AI Confidence" value={`${DEMO_METRICS.aiConfidence}%`} trend="Based on 127 supplements" icon={Brain} tone="violet" />
            </motion.div>

            {/* Continue Review + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-2 panel-atlas rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-atlas-cyan" />
                    Claims Requiring Review
                  </h3>
                  <span className="text-xs text-muted-foreground">3 active</span>
                </div>
                <div className="space-y-3">
                  <FeaturedClaimCard onClick={onContinue} />
                  <ClaimRow claimNumber="SF-2026-0472" customer="Robert Martinez" carrier="Allstate" amount="$18,200" status="waiting_on_carrier" />
                  <ClaimRow claimNumber="SF-2026-0475" customer="Lisa Thompson" carrier="USAA" amount="$31,500" status="inspection_scheduled" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="panel-atlas rounded-2xl p-6">
                <h3 className="font-display text-base flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {DEMO_TIMELINE.slice(-5).reverse().map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-atlas-cyan mt-2 shrink-0" />
                      <div>
                        <p className="text-sm">{event.action}</p>
                        <p className="text-[10px] text-muted-foreground">{event.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. CLAIM WORKSPACE
// ─────────────────────────────────────────────
type ViewState = "overview" | "evidence" | "compliance" | "review" | "export";

function ClaimWorkspace({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [view, setView] = useState<ViewState>("overview");
  const [thinking, setThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [oppActions, setOppActions] = useState<Record<string, OppAction>>({});
  const [showExport, setShowExport] = useState(false);
  const [exportGenerated, setExportGenerated] = useState(false);
  const [shownEvidence, setShownEvidence] = useState<string | null>(null);

  // Auto-start Atlas thinking on mount
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setThinking(true);
  }, []);

  // Animate thinking stream
  useEffect(() => {
    if (!thinking) return;
    if (thinkingStep >= AI_THINKING_STREAM.length) {
      setTimeout(() => setThinking(false), 800);
      return;
    }
    const timer = setTimeout(() => setThinkingStep((s) => s + 1), 600);
    return () => clearTimeout(timer);
  }, [thinking, thinkingStep]);

  const opportunities = DEMO_OPPORTUNITIES.map((o) => ({
    ...o,
    status: oppActions[o.id] ?? o.status,
  }));
  const selectedOpp = opportunities.find((o) => o.id === selectedOppId) ?? null;
  const selectedOppEvidence = selectedOpp
    ? DEMO_EVIDENCE.filter((e) => selectedOpp.evidenceIds.includes(e.id))
    : [];
  const approvedOpps = opportunities.filter((o) => o.status === "approved");
  const totalApproved = approvedOpps.reduce((s, o) => s + o.amountCents, 0);
  const totalRevenue = opportunities.reduce((s, o) => s + o.amountCents, 0);

  const handleAction = (id: string, action: OppAction) => {
    setOppActions((p) => ({ ...p, [id]: action }));
  };

  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={DEMO_CLAIM.claimNumber} subtitle={DEMO_CLAIM.customerName} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Back */}
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            {/* Claim Header */}
            <ClaimHeader />

            {/* Workflow Table */}
            <WorkflowTable />

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left — Main content area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Atlas Thinking Panel */}
                <AtlasThinkingPanel
                  thinking={thinking}
                  thinkingStep={thinkingStep}
                  isComplete={!thinking && thinkingStep >= AI_THINKING_STREAM.length}
                />

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
                  {([
                    { id: "overview", label: "Overview", icon: Sparkles },
                    { id: "evidence", label: "Evidence Center", icon: Network },
                    { id: "compliance", label: "Compliance", icon: ShieldCheck },
                    { id: "review", label: "Human Review", icon: CheckCircle2 },
                    { id: "export", label: "Export Package", icon: FileDown },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setView(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap",
                        view === tab.id
                          ? "border-atlas-cyan text-atlas-cyan"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* === Tab Content === */}
                <div>
                  {view === "overview" && (
                    <div className="space-y-6">
                      {/* Atlas Summary Card */}
                      <div className="panel-atlas rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-atlas-violet" />
                          <h3 className="font-display text-sm">Atlas Summary</h3>
                          <span className="ml-auto text-xs text-atlas-signal font-mono">{DEMO_CLAIM.aiConfidence}% confidence</span>
                        </div>
                        <p className="text-sm leading-relaxed">{DEMO_CLAIM.atlasSummary}</p>
                      </div>

                      {/* AI Findings */}
                      <div>
                        <h3 className="font-display text-base mb-3 flex items-center gap-2">
                          <Camera className="h-4 w-4 text-atlas-cyan" />
                          AI Findings
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {DEMO_FINDINGS.map((finding) => (
                            <div
                              key={finding.id}
                              className="panel-atlas rounded-xl p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className={cn(
                                  "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full",
                                  finding.severity === "high" && "bg-destructive/15 text-destructive",
                                  finding.severity === "medium" && "bg-amber-500/15 text-amber-400",
                                  finding.severity === "low" && "bg-slate-500/15 text-slate-400",
                                )}>
                                  {finding.severity}
                                </span>
                                <span className="text-xs text-muted-foreground">{finding.confidence}%</span>
                              </div>
                              <p className="text-sm font-medium">{finding.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{finding.location}</p>
                              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                                <Network className="h-3 w-3" />
                                {finding.evidenceIds.length} evidence links
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Revenue Opportunities Table */}
                      <div>
                        <h3 className="font-display text-base mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-atlas-signal" />
                          Revenue Opportunities
                        </h3>
                        <RevenueTable
                          opportunities={opportunities}
                          totalRevenue={totalRevenue}
                          selectedId={selectedOppId}
                          onSelect={setSelectedOppId}
                          onAction={handleAction}
                        />
                      </div>
                    </div>
                  )}

                  {view === "evidence" && (
                    <div className="space-y-4">
                      <EvidenceCenter
                        evidence={DEMO_EVIDENCE}
                        opportunities={opportunities}
                        onShowDetail={setShownEvidence}
                      />
                    </div>
                  )}

                  {view === "compliance" && (
                    <div className="space-y-4">
                      <CompliancePanel opportunities={opportunities} />
                    </div>
                  )}

                  {view === "review" && (
                    <div className="space-y-4">
                      <HumanReviewPanel
                        opportunities={opportunities}
                        onAction={handleAction}
                        onExport={() => { setView("export"); }}
                      />
                    </div>
                  )}

                  {view === "export" && (
                    <div className="space-y-4">
                      <ExportPanel
                        approvedOpps={approvedOpps}
                        totalApproved={totalApproved}
                        onGenerate={() => {
                          setShowExport(true);
                          setExportGenerated(true);
                          setTimeout(() => onComplete(), 2500);
                        }}
                        generated={exportGenerated}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Atlas AI Panel */}
              <div className="space-y-6">
                {/* Thinking stream (pinned) */}
                <AtlasThinkingPanel
                  thinking={thinking}
                  thinkingStep={thinkingStep}
                  isComplete={!thinking && thinkingStep >= AI_THINKING_STREAM.length}
                  compact
                />

                {/* Recommendation Detail */}
                {selectedOpp ? (
                  <RecommendationDetail opp={selectedOpp} evidence={selectedOppEvidence} />
                ) : (
                  <div className="panel-atlas rounded-2xl p-6 text-center">
                    <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a revenue opportunity to see Atlas's reasoning, evidence, and compliance validation.
                    </p>
                  </div>
                )}

                {/* AI Session History */}
                <SessionHistory />
              </div>
            </div>

            {/* Evidence Detail Modal */}
            <AnimatePresence initial={false}>
              {shownEvidence && (
                <EvidenceModal
                  evidence={DEMO_EVIDENCE.find((e) => e.id === shownEvidence)!}
                  onClose={() => setShownEvidence(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
function Sidebar() {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", active: true },
    { icon: "claims", label: "Claims" },
    { icon: "supplements", label: "Supplements" },
    { icon: "customers", label: "Customers" },
    { icon: "documents", label: "Documents" },
    { icon: "ai", label: "AI Assistant" },
    { icon: "settings", label: "Settings" },
  ];
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    dashboard: TrendingUp, claims: FileText, supplements: Sparkles,
    customers: Building2, documents: FolderOpen, ai: Brain, settings: ShieldCheck,
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-atlas-navy/40 backdrop-blur-xl">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-atlas-cyan/30 to-atlas-violet/30 flex items-center justify-center">
            <Brain className="h-5 w-5 text-atlas-cyan" />
          </div>
          <span className="font-display text-xl text-gradient-atlas">ATLAS</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">AI Operations</p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          return (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition cursor-pointer",
                item.active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 text-xs text-muted-foreground truncate">
          sarah.mitchell@summitrestoration.com
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-border bg-atlas-navy/30 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-lg sm:text-xl truncate">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
    </header>
  );
}

function KpiCard({ label, value, trend, icon: Icon, tone }: {
  label: string; value: string; trend: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "signal" | "cyan" | "violet";
}) {
  const toneClass = tone === "signal" ? "text-atlas-signal" : tone === "violet" ? "text-atlas-violet" : "text-atlas-cyan";
  return (
    <motion.div className="panel-atlas rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4", toneClass)} />
      </div>
      <p className="font-display text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{trend}</p>
    </motion.div>
  );
}

function FeaturedClaimCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group rounded-xl border border-atlas-cyan/20 bg-atlas-cyan/5 p-4 cursor-pointer hover:border-atlas-cyan/40 transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium">{DEMO_CLAIM.claimNumber} — {DEMO_CLAIM.customerName}</p>
          <p className="text-xs text-muted-foreground">{DEMO_CLAIM.propertyAddress}</p>
        </div>
        <span className="text-[10px] uppercase bg-atlas-cyan/15 text-atlas-cyan px-2 py-0.5 rounded-full">Featured</span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="font-mono text-atlas-signal">{formatMoney(DEMO_CLAIM.potentialRevenue * 100)}</span>
        <span className="text-muted-foreground">{DEMO_CLAIM.aiConfidence}% confidence</span>
        <span className="text-muted-foreground">{DEMO_CLAIM.evidenceCompleteness}% evidence</span>
      </div>
      <button className="mt-3 flex items-center gap-1.5 text-sm text-atlas-cyan font-medium group-hover:gap-2 transition-all">
        Continue Review <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ClaimRow({ claimNumber, customer, carrier, amount, status }: {
  claimNumber: string; customer: string; carrier: string; amount: string; status: string;
}) {
  const statusLabel = status === "waiting_on_carrier" ? "Waiting on Carrier" : "Inspection Scheduled";
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition cursor-pointer">
      <div>
        <p className="text-sm font-medium">{claimNumber} — {customer}</p>
        <p className="text-xs text-muted-foreground">{carrier}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono">{amount}</span>
        <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">{statusLabel}</span>
      </div>
    </div>
  );
}

function ClaimHeader() {
  const claim = DEMO_CLAIM;
  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="panel-atlas rounded-2xl p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <HeaderField label="Customer" value={claim.customerName} icon={Building2} />
        <HeaderField label="Property" value={claim.propertyAddress} icon={MapPin} />
        <HeaderField label="Carrier" value={claim.carrier} icon={ShieldCheck} />
        <HeaderField label="Claim #" value={claim.claimNumber} icon={FileText} mono />
        <HeaderField label="Date of Loss" value={new Date(claim.dateOfLoss).toLocaleDateString()} icon={Clock} />
        <HeaderField label="Adjuster" value={claim.adjuster} icon={Phone} />
      </div>
      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-border">
        <MetricField label="Claim State" value="Supplement Pending" />
        <MetricField label="Potential Revenue" value={formatMoney(claim.potentialRevenue * 100)} accent="signal" />
        <MetricField label="AI Confidence" value={`${claim.aiConfidence}%`} accent="cyan" />
        <MetricField label="Evidence" value={`${claim.evidenceCompleteness}%`} accent="violet" />
        <MetricField label="Health Score" value={`${claim.claimHealthScore}/100`} accent="signal" />
        <MetricField label="Claim Value" value={formatMoney(claim.claimValue * 100)} />
      </div>
    </motion.div>
  );
}

function HeaderField({ label, value, icon: Icon, mono }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>; mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={cn("text-sm mt-0.5 truncate", mono && "font-mono text-atlas-cyan")}>{value}</p>
    </div>
  );
}

function MetricField({ label, value, accent }: { label: string; value: string; accent?: "signal" | "cyan" | "violet" }) {
  const accentClass = accent === "signal" ? "text-atlas-signal" : accent === "cyan" ? "text-atlas-cyan" : accent === "violet" ? "text-atlas-violet" : "";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg mt-0.5", accentClass)}>{value}</p>
    </div>
  );
}

function WorkflowTable() {
  const [expanded, setExpanded] = useState(true);
  const stages = [
    { step: "Claim Created", status: "complete", ai: "Claim stored", user: "Review", time: "Jan 14 9:15 AM", detail: "Claim SF-2026-0481 created. Customer Michael Chen assigned. State Farm carrier linked." },
    { step: "Documents Uploaded", status: "complete", ai: "OCR complete", user: "View", time: "Jan 16 9:00 AM", detail: "12 documents processed: carrier estimate (84 items), inspection report, moisture map, manufacturer specs. All extracted and categorized via OCR." },
    { step: "Photos Uploaded", status: "complete", ai: "Damage detected", user: "View", time: "Jan 15 2:30 PM", detail: "67 photos analyzed. AI detected: missing ridge cap, chimney flashing damage, valley damage, interior drywall damage, elevated attic moisture." },
    { step: "AI Findings", status: "complete", ai: "Damage identified", user: "Review", time: "Jan 16 10:45 AM", detail: "6 findings generated: 2 high severity (ridge cap, drywall), 3 medium (flashing, valley, moisture), 1 low (pricing). All findings linked to photographic evidence." },
    { step: "Decision Engine", status: "complete", ai: "Opportunities created", user: "Review", time: "Jan 16 10:47 AM", detail: "8 revenue opportunities generated from findings. Total estimated recoverable: $4,260. Top opportunity: ridge cap replacement ($420) at 98% confidence." },
    { step: "Compliance Validation", status: "complete", ai: "Rules validated", user: "Review", time: "Jan 16 10:46 AM", detail: "6 code references validated against IRC and manufacturer specs. 2 opportunities flagged for additional documentation. All recommendations backed by building code." },
    { step: "Human Review", status: "active", ai: "Awaiting approval", user: "Approve", time: "—", detail: "8 opportunities waiting for your approval. 6 are compliance-validated and ready to approve. 2 require additional documentation before approval." },
    { step: "Package Generation", status: "pending", ai: "Waiting", user: "Export", time: "—", detail: "Once approvals are complete, Atlas will generate a professional supplement package with executive summary, evidence, and compliance notes." },
  ];

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full panel-atlas rounded-xl p-4 text-left hover:border-primary/30 transition group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-atlas-cyan" />
            <span className="font-display text-sm">Claim Workflow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">6/8 complete</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-atlas-cyan to-atlas-violet" style={{ width: "75%" }} />
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="panel-atlas rounded-xl overflow-hidden mt-2">
          <div className="grid grid-cols-[minmax(0,1.5fr)_100px_120px_80px] gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground bg-white/[0.03] border-b border-border">
            <span>Step</span>
            <span>AI Action</span>
            <span>Your Action</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-border">
            {stages.map((stage, i) => (
              <WorkflowRow key={i} stage={stage} index={i} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function WorkflowRow({ stage, index }: { stage: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "grid grid-cols-[minmax(0,1.5fr)_100px_120px_80px] gap-2 px-4 py-3 items-center text-sm cursor-pointer transition-colors",
          stage.status === "active" && "bg-atlas-cyan/5",
        )}
      >
        <div className="flex items-center gap-2">
          {stage.status === "complete" ? (
            <CheckCircle2 className="h-4 w-4 text-atlas-signal shrink-0" />
          ) : stage.status === "active" ? (
            <Loader2 className="h-4 w-4 text-atlas-cyan animate-spin shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
          )}
          <span className="truncate font-medium">{stage.step}</span>
          {expanded && <ChevronDown className="h-3 w-3 ml-auto" />}
        </div>
        <span className="text-xs text-muted-foreground truncate">{stage.status === "pending" ? "—" : stage.ai}</span>
        <span className={cn("text-xs truncate", stage.status === "active" ? "text-atlas-cyan font-medium" : "text-muted-foreground")}>
          {stage.status === "pending" ? "—" : stage.user}
        </span>
        <span>
          <StatusBadge status={stage.status} />
        </span>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-white/[0.02] text-sm space-y-1">
              <p className="text-muted-foreground">{stage.detail}</p>
              <p className="text-[10px] text-muted-foreground">{stage.time}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    complete: "bg-atlas-signal/15 text-atlas-signal",
    active: "bg-atlas-cyan/15 text-atlas-cyan",
    pending: "bg-white/5 text-muted-foreground",
  };
  const labels = { complete: "Complete", active: "Active", pending: "Pending" };
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", styles[status as keyof typeof styles] ?? styles.pending)}>
      {labels[status as keyof typeof labels] ?? "Pending"}
    </span>
  );
}

function AtlasThinkingPanel({ thinking, thinkingStep, isComplete, compact }: {
  thinking: boolean;
  thinkingStep: number;
  isComplete: boolean;
  compact?: boolean;
}) {
  const steps = AI_THINKING_STREAM.slice(0, thinkingStep);

  return (
    <div className={cn("panel-atlas rounded-2xl", compact ? "p-4" : "p-6")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {thinking ? (
            <Loader2 className="h-4 w-4 text-atlas-cyan animate-spin" />
          ) : isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-atlas-signal" />
          ) : (
            <Brain className="h-4 w-4 text-atlas-cyan" />
          )}
          <h3 className="font-display text-sm">
            {thinking ? "Atlas is thinking..." : isComplete ? "Analysis complete" : "Atlas Thinking"}
          </h3>
        </div>
      </div>

      <div className="space-y-1.5 min-h-[80px]">
        <AnimatePresence initial={false}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-2 text-sm",
                i === steps.length - 1 && thinking ? "text-atlas-cyan" : "text-muted-foreground",
              )}
            >
              <span className="text-[10px] font-mono opacity-50">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mt-3 pt-3 border-t border-border"
        >
          <p className="text-xs text-muted-foreground">
            {DEMO_CLAIM.estimateLineItems} line items analyzed · {DEMO_CLAIM.photoCount} photos processed · {DEMO_OPPORTUNITIES.length} opportunities found
          </p>
        </motion.div>
      )}
    </div>
  );
}

function RevenueTable({ opportunities, totalRevenue, selectedId, onSelect, onAction }: {
  opportunities: DemoOpportunity[];
  totalRevenue: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAction: (id: string, action: OppAction) => void;
}) {
  return (
    <div className="panel-atlas rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,2fr)_100px_70px_60px_100px_140px] gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground bg-white/[0.03] border-b border-border">
        <span>Opportunity</span>
        <span>Revenue</span>
        <span>Conf.</span>
        <span>Evid.</span>
        <span>Compliance</span>
        <span>Actions</span>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            onClick={() => onSelect(selectedId === opp.id ? "" : opp.id)}
            className={cn(
              "grid grid-cols-[minmax(0,2fr)_100px_70px_60px_100px_140px] gap-2 px-4 py-3 items-center text-sm cursor-pointer transition-colors hover:bg-white/[0.03]",
              selectedId === opp.id && "bg-atlas-cyan/5 ring-1 ring-atlas-cyan/20",
              opp.status === "approved" && "opacity-60",
              opp.status === "rejected" && "opacity-40 line-through",
            )}
          >
            {/* Description */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "text-[10px] uppercase px-1.5 py-0.5 rounded shrink-0",
                opp.priority === "high" ? "bg-destructive/15 text-destructive" : opp.priority === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-slate-500/15 text-slate-400",
              )}>{opp.priority}</span>
              <span className="truncate">{opp.description}</span>
            </div>
            {/* Revenue */}
            <span className="font-mono text-atlas-signal">{formatMoney(opp.amountCents)}</span>
            {/* Confidence */}
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-10 rounded-full bg-white/10 overflow-hidden">
                <div className={cn("h-full rounded-full", opp.confidence >= 90 ? "bg-atlas-signal" : "bg-amber-500")} style={{ width: `${opp.confidence}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{opp.confidence}%</span>
            </div>
            {/* Evidence count */}
            <span className="text-xs text-muted-foreground">{opp.evidenceCount}</span>
            {/* Compliance */}
            <span className={cn("text-xs font-medium", opp.complianceStatus === "validated" ? "text-atlas-signal" : opp.complianceStatus === "pending" ? "text-amber-400" : "text-destructive")}>
              {opp.complianceStatus === "validated" ? "Validated" : opp.complianceStatus === "pending" ? "Pending" : "Flagged"}
            </span>
            {/* Actions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {opp.status === "new" && (
                <>
                  <button onClick={() => onAction(opp.id, "approved")} className="p-1.5 rounded hover:bg-atlas-signal/10 text-atlas-signal transition" title="Approve">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onAction(opp.id, "rejected")} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition" title="Reject">
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onAction(opp.id, "edited")} className="p-1.5 rounded hover:bg-white/10 text-muted-foreground transition" title="Edit">
                    <Edit3 className="h-3 w-3" />
                  </button>
                </>
              )}
              {opp.status === "approved" && <span className="text-[10px] text-atlas-signal">✓ Approved</span>}
              {opp.status === "rejected" && <span className="text-[10px] text-destructive">✗ Rejected</span>}
              {opp.status === "edited" && <span className="text-[10px] text-amber-400">✎ Edited</span>}
            </div>
          </div>
        ))}
      </div>
      {/* Total */}
      <div className="px-4 py-3 bg-white/[0.03] border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total recoverable revenue</span>
        <span className="font-mono text-lg text-atlas-signal">{formatMoney(totalRevenue)}</span>
      </div>
    </div>
  );
}

function RecommendationDetail({ opp, evidence }: {
  opp: DemoOpportunity;
  evidence: DemoEvidence[];
}) {
  return (
    <div className="panel-atlas rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-atlas-violet" />
          <h3 className="font-display text-sm">Recommendation Detail</h3>
        </div>
        <span className={cn("font-mono text-sm font-bold", opp.confidence >= 90 ? "text-atlas-signal" : "text-amber-400")}>
          {opp.confidence}%
        </span>
      </div>
      <div className="p-5 space-y-4">
        {/* Description */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Recommendation</p>
          <p className="text-sm font-medium">{opp.description}</p>
        </div>

        {/* Reasoning */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Reasoning</p>
          <p className="text-xs leading-relaxed">{opp.reasoning}</p>
        </div>

        {/* Action */}
        <div className="rounded-lg bg-atlas-cyan/5 border border-atlas-cyan/15 p-3">
          <p className="text-xs uppercase tracking-widest text-atlas-cyan mb-1">Suggested Action</p>
          <p className="text-xs">{opp.action}</p>
        </div>

        {/* Evidence used */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Supporting Evidence</p>
          <div className="space-y-1.5">
            {evidence.map((e) => (
              <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] text-xs">
                <FileText className="h-3 w-3 text-atlas-cyan mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{e.label}</p>
                  <p className="text-[10px] text-muted-foreground">{e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code references */}
        {opp.codeReferences.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Code References</p>
            <div className="space-y-1.5">
              {opp.codeReferences.map((c, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs">
                  <ShieldCheck className="h-3 w-3 text-atlas-signal mt-0.5 shrink-0" />
                  <div>
                    <p className="font-mono text-atlas-cyan">{c.code}</p>
                    <p className="text-[10px] text-muted-foreground">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing docs */}
        {opp.missingDocumentation.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400 mb-1">Missing Documentation</p>
            <ul className="space-y-1">
              {opp.missingDocumentation.map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-400">•</span> {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Adjuster objection */}
        {opp.potentialObjection && (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3">
            <p className="text-xs uppercase tracking-widest text-amber-400 mb-1">Potential Adjuster Objection</p>
            <p className="text-xs text-muted-foreground">{opp.potentialObjection}</p>
            {opp.suggestedResponse && (
              <>
                <p className="text-xs uppercase tracking-widest text-atlas-signal mt-2 mb-1">Suggested Response</p>
                <p className="text-xs text-muted-foreground">{opp.suggestedResponse}</p>
              </>
            )}
          </div>
        )}

        {/* Revenue estimate */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-atlas-signal/5 border border-atlas-signal/15">
          <span className="text-xs text-muted-foreground">Estimated Recovery</span>
          <span className="font-mono text-atlas-signal font-bold">{formatMoney(opp.amountCents)}</span>
        </div>
      </div>
    </div>
  );
}

function EvidenceCenter({ evidence, opportunities, onShowDetail }: {
  evidence: DemoEvidence[];
  opportunities: DemoOpportunity[];
  onShowDetail: (id: string) => void;
}) {
  const grouped = evidence.reduce((acc, e) => {
    const key = e.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {} as Record<string, DemoEvidence[]>);

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    photo: Camera, document: FileText, code: ShieldCheck, estimate: DollarSign,
    inspection: FileText, manufacturer: FileText, invoice: FileText,
  };
  const typeLabels: Record<string, string> = {
    photo: "Photos", document: "Documents", code: "Building Codes", estimate: "Estimate",
    inspection: "Inspection", manufacturer: "Manufacturer Specs", invoice: "Invoices",
  };

  return (
    <div className="space-y-4">
      <div className="panel-atlas rounded-2xl p-5">
        <h3 className="font-display text-base flex items-center gap-2 mb-4">
          <Network className="h-4 w-4 text-atlas-cyan" />
          Evidence Center
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Every recommendation links directly to evidence — photos, documents, building codes, and manufacturer specifications. Select an item to see linked recommendations.
        </p>
      </div>

      {Object.entries(grouped).map(([type, items]) => {
        const Icon = typeIcons[type] ?? FileText;
        return (
          <div key={type} className="panel-atlas rounded-xl p-4">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" /> {typeLabels[type] ?? type} ({items.length})
            </h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const linkedOpps = opportunities.filter((o) => o.evidenceIds.includes(item.id));
                return (
                  <div
                    key={item.id}
                    onClick={() => onShowDetail(item.id)}
                    className="rounded-lg border border-border bg-white/[0.03] p-3 hover:bg-white/[0.06] transition cursor-pointer group"
                  >
                    <p className="text-sm font-medium group-hover:text-atlas-cyan transition">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <Link2 className="h-3 w-3" />
                      {linkedOpps.length} recommendation{linkedOpps.length !== 1 ? "s" : ""} linked
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceModal({ evidence, onClose }: { evidence: DemoEvidence; onClose: () => void }) {
  const linkedOpps = DEMO_OPPORTUNITIES.filter((o) => o.evidenceIds.includes(evidence.id));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-atlas-void/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 1, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="panel-atlas rounded-2xl max-w-lg w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-atlas-cyan" />
            <h3 className="font-display text-base">{evidence.label}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{evidence.detail}</p>
        <p className="text-xs text-muted-foreground mb-2">Date: {evidence.date}</p>
        <div className="pt-4 border-t border-border">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Linked Recommendations</p>
          <div className="space-y-2">
            {linkedOpps.map((opp) => (
              <div key={opp.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-sm">{opp.description}</span>
                <span className="font-mono text-xs text-atlas-signal">{formatMoney(opp.amountCents)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompliancePanel({ opportunities }: { opportunities: DemoOpportunity[] }) {
  const validated = opportunities.filter((o) => o.complianceStatus === "validated");
  const pending = opportunities.filter((o) => o.complianceStatus === "pending");
  const flagged = opportunities.filter((o) => o.complianceStatus === "flagged");

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <ComplianceSummaryCard count={validated.length} label="Ready to Submit" tone="signal" />
        <ComplianceSummaryCard count={pending.length} label="Needs Documentation" tone="amber" />
        <ComplianceSummaryCard count={flagged.length} label="Manual Review" tone="destructive" />
      </div>

      {/* Details */}
      <div className="panel-atlas rounded-2xl p-5">
        <h3 className="font-display text-base mb-4">Compliance Validation</h3>
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div key={opp.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium">{opp.description}</p>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full shrink-0",
                  opp.complianceStatus === "validated" ? "bg-atlas-signal/15 text-atlas-signal" :
                  opp.complianceStatus === "pending" ? "bg-amber-500/15 text-amber-400" : "bg-destructive/15 text-destructive")}>
                  {opp.complianceStatus === "validated" ? "Validated" : opp.complianceStatus === "pending" ? "Pending" : "Flagged"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{opp.rationale}</p>
              {opp.codeReferences.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {opp.codeReferences.map((c, i) => (
                    <span key={i} className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                      ✓ {c.code}
                    </span>
                  ))}
                </div>
              )}
              {opp.missingDocumentation.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Missing: {opp.missingDocumentation.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceSummaryCard({ count, label, tone }: { count: number; label: string; tone: string }) {
  const toneClass = tone === "signal" ? "text-atlas-signal" : tone === "amber" ? "text-amber-400" : "text-destructive";
  return (
    <div className="panel-atlas rounded-xl p-4 text-center">
      <p className={cn("font-display text-2xl", toneClass)}>{count}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function HumanReviewPanel({ opportunities, onAction, onExport }: {
  opportunities: DemoOpportunity[];
  onAction: (id: string, action: OppAction) => void;
  onExport: () => void;
}) {
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approved = opportunities.filter((o) => o.status === "approved");
  const rejected = opportunities.filter((o) => o.status === "rejected");
  const pending = opportunities.filter((o) => o.status === "new");

  const handleReject = (id: string) => {
    onAction(id, "rejected");
    setShowRejectDialog(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="panel-atlas rounded-2xl p-5">
        <h3 className="font-display text-base mb-4">Human Review</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-atlas-signal/5 border border-atlas-signal/15 p-3 text-center">
            <p className="font-display text-2xl text-atlas-signal">{approved.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Approved</p>
          </div>
          <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 text-center">
            <p className="font-display text-2xl text-destructive">{rejected.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rejected</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-border p-3 text-center">
            <p className="font-display text-2xl text-muted-foreground">{pending.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pending</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Review each recommendation. Approve, reject (with reason — becomes a learning event), or edit.
          Rejections train Atlas's future recommendations.
        </p>
      </div>

      {/* Review items */}
      <div className="space-y-3">
        {opportunities.map((opp) => (
          <div key={opp.id} className="panel-atlas rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{opp.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opp.rationale}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-sm text-atlas-signal">{formatMoney(opp.amountCents)}</span>
                  <span className="text-xs text-muted-foreground">{opp.confidence}% confidence</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {opp.status === "new" && (
                  <>
                    <button onClick={() => onAction(opp.id, "approved")} className="px-3 py-1.5 rounded-lg bg-atlas-signal/10 text-atlas-signal text-xs font-medium hover:bg-atlas-signal/20 transition flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </button>
                    <button onClick={() => setShowRejectDialog(opp.id)} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                  </>
                )}
                {opp.status === "approved" && <span className="text-xs text-atlas-signal">✓ Approved</span>}
                {opp.status === "rejected" && <span className="text-xs text-destructive">✗ Rejected</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export CTA */}
      {approved.length > 0 && (
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="panel-atlas rounded-2xl p-5">
          <p className="text-sm">
            {approved.length} recommendations approved. Total estimated recovery:{" "}
            <span className="font-mono text-atlas-signal">{formatMoney(approved.reduce((s, o) => s + o.amountCents, 0))}</span>
          </p>
          <button onClick={onExport} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-atlas-cyan to-atlas-cyan-soft text-atlas-void font-semibold text-sm hover:shadow-[0_0_30px_-5px_var(--atlas-cyan)] transition">
            <FileDown className="h-4 w-4" /> Generate Supplement Package
          </button>
        </motion.div>
      )}
    </div>
  );
}

function ExportPanel({ approvedOpps, totalApproved, onGenerate, generated }: {
  approvedOpps: DemoOpportunity[];
  totalApproved: number;
  onGenerate: () => void;
  generated: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="panel-atlas rounded-2xl p-6">
        <h3 className="font-display text-base flex items-center gap-2 mb-4">
          <FileDown className="h-4 w-4 text-atlas-cyan" />
          Supplement Package Export
        </h3>

        {!generated ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Atlas will generate a professional supplement package containing:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                "Executive Summary", "Recommendations", "Evidence Documentation",
                "Photo References", "Compliance Notes", "Adjuster Summary",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-3 w-3 text-atlas-signal" /> {item}
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-atlas-signal/5 border border-atlas-signal/15 p-4 mb-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Estimated Additional Revenue</p>
              <p className="font-display text-3xl text-atlas-signal">{formatMoney(totalApproved)}</p>
              <p className="text-xs text-muted-foreground mt-1">{approvedOpps.length} approved recommendations</p>
            </div>
            <button onClick={onGenerate} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-atlas-cyan to-atlas-cyan-soft text-atlas-void font-semibold text-sm hover:shadow-[0_0_30px_-5px_var(--atlas-cyan)] transition">
              <FileDown className="h-4 w-4" /> Generate Supplement Package
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-atlas-signal/15 flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="h-8 w-8 text-atlas-signal" />
            </motion.div>
            <h3 className="font-display text-xl mb-2">Package Ready</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Professional supplement package generated successfully.
            </p>
            <div className="rounded-lg bg-atlas-signal/5 border border-atlas-signal/15 p-4 mb-4 max-w-xs mx-auto">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Estimated Additional Revenue</p>
              <p className="font-display text-2xl text-atlas-signal">{formatMoney(totalApproved)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Package contains: Executive Summary, {approvedOpps.length} Recommendations, 14 Evidence Items, 6 Code References
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SessionHistory() {
  return (
    <div className="panel-atlas rounded-2xl p-5">
      <h3 className="font-display text-sm flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        AI Session History
      </h3>
      <div className="space-y-2">
        {DEMO_SESSION_LOGS.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 text-sm"
          >
            <span className="text-[10px] font-mono text-muted-foreground w-12 shrink-0">{log.timestamp}</span>
            <span className="text-muted-foreground">{log.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 14. DEMO COMPLETE
// ─────────────────────────────────────────────
function DemoComplete({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 1, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="max-w-2xl w-full">
        <div className="panel-atlas rounded-3xl p-12 text-center glow-cyan">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mx-auto w-20 h-20 rounded-full bg-atlas-signal/15 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-atlas-signal" />
          </motion.div>

          <h2 className="font-display text-3xl mb-3 text-gradient-atlas">Demo Complete</h2>

          <p className="text-lg text-muted-foreground mb-2">
            Atlas helped identify{" "}
            <span className="text-atlas-signal font-bold">{formatMoney(DEMO_METRICS.potentialRevenue)}</span>{" "}
            in additional recoverable revenue
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            backed by evidence and compliance validation.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <ResultStat value="84" label="Line Items Analyzed" />
            <ResultStat value="67" label="Photos Processed" />
            <ResultStat value="8" label="Opportunities Found" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onReturn} className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-atlas-cyan to-atlas-cyan-soft text-atlas-void font-semibold text-sm hover:shadow-[0_0_30px_-5px_var(--atlas-cyan)] transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ResultStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-atlas-cyan">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
