import { cn } from "@/lib/utils.ts";
import { Badge } from "@/components/ui/badge.tsx";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  Camera,
  Brain,
  DollarSign,
  ShieldCheck,
  FileDown,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export type WorkflowStage =
  | "claim_created"
  | "documents_uploaded"
  | "photos_uploaded"
  | "ai_analysis"
  | "revenue_opportunities"
  | "compliance_validation"
  | "supplement_draft"
  | "export_package";

export const STAGES: {
  key: WorkflowStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  aiAction: string;
  userAction: string;
}[] = [
  {
    key: "claim_created",
    label: "Claim Created",
    icon: FileText,
    aiAction: "Store claim",
    userAction: "Review",
  },
  {
    key: "documents_uploaded",
    label: "Documents Uploaded",
    icon: FileText,
    aiAction: "OCR + classify",
    userAction: "Upload missing docs",
  },
  {
    key: "photos_uploaded",
    label: "Photos Uploaded",
    icon: Camera,
    aiAction: "Analyze damage",
    userAction: "Add photos",
  },
  {
    key: "ai_analysis",
    label: "AI Analysis",
    icon: Brain,
    aiAction: "Find missing scope",
    userAction: "Wait",
  },
  {
    key: "revenue_opportunities",
    label: "Revenue Opportunities",
    icon: DollarSign,
    aiAction: "Generate recommendations",
    userAction: "Review",
  },
  {
    key: "compliance_validation",
    label: "Compliance Validation",
    icon: ShieldCheck,
    aiAction: "Validate against rules",
    userAction: "Approve",
  },
  {
    key: "supplement_draft",
    label: "Supplement Draft",
    icon: Sparkles,
    aiAction: "Create package",
    userAction: "Edit",
  },
  {
    key: "export_package",
    label: "Export Package",
    icon: FileDown,
    aiAction: "Generate PDF",
    userAction: "Submit",
  },
];

export type StageStatus = "pending" | "active" | "complete" | "error";

export interface StageState {
  key: WorkflowStage;
  status: StageStatus;
  aiSummary?: string;
  completedAt?: string;
  errorDetail?: string;
}

type Props = {
  stages: StageState[];
  onStageAction?: (stage: WorkflowStage) => void;
};

export function ClaimWorkflow({ stages, onStageAction }: Props) {
  const [expanded, setExpanded] = useState(false);

  const stageMap = new Map(stages.map((s) => [s.key, s]));
  const currentIdx = stages.findIndex((s) => s.status === "active");
  const completeCount = stages.filter((s) => s.status === "complete").length;
  const total = STAGES.length;

  // Mobile: show compact progress bar
  // Desktop: show full table
  return (
    <div className="space-y-3">
      {/* Compact progress bar — always visible */}
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
            <span className="text-xs text-muted-foreground">
              {completeCount}/{total} complete
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-180",
              )}
            />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-atlas-cyan to-atlas-violet transition-all duration-700"
            style={{ width: `${(completeCount / total) * 100}%` }}
          />
        </div>
        {currentIdx >= 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Current:{" "}
            <span className="text-atlas-cyan font-medium">
              {STAGES[currentIdx].label}
            </span>
          </p>
        )}
      </button>

      {/* Expanded detail table */}
      {expanded && (
        <div className="panel-atlas rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground bg-white/[0.03] border-b border-border">
            <span>Step</span>
            <span>AI Action</span>
            <span>Your Action</span>
            <span>Status</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border">
            {STAGES.map((stage) => {
              const state = stageMap.get(stage.key);
              const status = state?.status ?? "pending";
              const Icon = stage.icon;

              return (
                <div
                  key={stage.key}
                  className={cn(
                    "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 px-4 py-3 items-center text-sm transition-colors",
                    status === "active" && "bg-atlas-cyan/5",
                    status === "complete" && "opacity-80",
                  )}
                >
                  {/* Step name + icon */}
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon status={status} />
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        status === "active"
                          ? "text-atlas-cyan"
                          : status === "complete"
                            ? "text-atlas-signal"
                            : "text-muted-foreground",
                      )}
                    />
                    <span className="truncate font-medium">{stage.label}</span>
                  </div>

                  {/* AI Action */}
                  <span className="text-xs text-muted-foreground truncate">
                    {status === "complete"
                      ? "Done"
                      : status === "active"
                        ? stage.aiAction
                        : stage.aiAction}
                  </span>

                  {/* User Action */}
                  <span className="text-xs truncate">
                    {status === "pending" && (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {status === "active" && (
                      <span className="text-atlas-cyan">{stage.userAction}</span>
                    )}
                    {status === "complete" && (
                      <span className="text-muted-foreground line-through">
                        {stage.userAction}
                      </span>
                    )}
                    {status === "error" && (
                      <span className="text-destructive">Retry</span>
                    )}
                  </span>

                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <StageBadge status={status} />
                    {status === "complete" && state?.completedAt && (
                      <span className="text-[10px] text-muted-foreground hidden lg:inline">
                        {new Date(state.completedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: StageStatus }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-atlas-signal shrink-0" />;
    case "active":
      return <Loader2 className="h-4 w-4 text-atlas-cyan animate-spin shrink-0" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />;
  }
}

function StageBadge({ status }: { status: StageStatus }) {
  const base = "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0";
  switch (status) {
    case "complete":
      return (
        <span className={cn(base, "bg-atlas-signal/15 text-atlas-signal")}>
          Complete
        </span>
      );
    case "active":
      return (
        <span className={cn(base, "bg-atlas-cyan/15 text-atlas-cyan")}>
          Active
        </span>
      );
    case "error":
      return (
        <span className={cn(base, "bg-destructive/15 text-destructive")}>
          Error
        </span>
      );
    default:
      return (
        <span className={cn(base, "bg-white/5 text-muted-foreground")}>
          Pending
        </span>
      );
  }
}
