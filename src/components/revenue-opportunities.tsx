import { useState } from "react";
import { cn } from "@/lib/utils.ts";
import { formatMoney } from "@/lib/atlas-db.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Check,
  X,
  Pencil,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

export interface RevenueOpportunity {
  id: string;
  description: string;
  category: string;
  amount_cents: number;
  confidence: number;
  evidence_count: number;
  compliance_status: "validated" | "pending" | "flagged";
  priority: "high" | "medium" | "low";
  status: "new" | "approved" | "rejected" | "edited";
  rationale: string;
  action: string;
  evidence_ids?: string[];
  risk_flags?: string[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const COMPLIANCE_COLORS: Record<string, { color: string; label: string }> = {
  validated: { color: "text-atlas-signal", label: "Validated" },
  pending: { color: "text-amber-400", label: "Pending" },
  flagged: { color: "text-destructive", label: "Flagged" },
};

type Props = {
  opportunities: RevenueOpportunity[];
  totalRevenue: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onAskAI: (id: string) => void;
  onViewEvidence: (id: string) => void;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
};

export function RevenueOpportunitiesPanel({
  opportunities,
  totalRevenue,
  onApprove,
  onReject,
  onEdit,
  onAskAI,
  onViewEvidence,
  selectedId,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (opportunities.length === 0) {
    return (
      <Card className="panel-atlas border-0">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No revenue opportunities yet. Run AI analysis to discover missed revenue.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-atlas-signal" />
            Revenue Opportunities
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {opportunities.length} opportunities ·{" "}
            <span className="text-atlas-signal font-mono">
              {formatMoney(totalRevenue)}
            </span>{" "}
            recoverable
          </p>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block panel-atlas rounded-xl overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_120px_80px_80px_100px_140px] gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground bg-white/[0.03] border-b border-border">
          <span>Description</span>
          <span>Revenue</span>
          <span>Confidence</span>
          <span>Evidence</span>
          <span>Compliance</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-border">
          {opportunities.map((opp) => {
            const isExpanded = expanded.has(opp.id);
            const isSelected = selectedId === opp.id;

            return (
              <div key={opp.id}>
                <div
                  onClick={() => onSelect?.(isSelected ? null : opp.id)}
                  className={cn(
                    "grid grid-cols-[minmax(0,2fr)_120px_80px_80px_100px_140px] gap-2 px-4 py-3 items-center text-sm cursor-pointer transition-colors hover:bg-white/[0.03]",
                    isSelected && "bg-atlas-cyan/5 ring-1 ring-atlas-cyan/20",
                    opp.status === "approved" && "opacity-60",
                    opp.status === "rejected" && "opacity-40 line-through",
                  )}
                >
                  {/* Description */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase shrink-0",
                        PRIORITY_COLORS[opp.priority],
                      )}
                    >
                      {opp.priority}
                    </Badge>
                    <span className="truncate">{opp.description}</span>
                  </div>

                  {/* Revenue */}
                  <span className="font-mono text-atlas-signal">
                    {formatMoney(opp.amount_cents)}
                  </span>

                  {/* Confidence */}
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-12 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          opp.confidence >= 90
                            ? "bg-atlas-signal"
                            : opp.confidence >= 70
                              ? "bg-amber-500"
                              : "bg-destructive",
                        )}
                        style={{ width: `${opp.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {opp.confidence}%
                    </span>
                  </div>

                  {/* Evidence */}
                  <span className="text-xs text-muted-foreground">
                    {opp.evidence_count} items
                  </span>

                  {/* Compliance */}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      COMPLIANCE_COLORS[opp.compliance_status].color,
                    )}
                  >
                    {COMPLIANCE_COLORS[opp.compliance_status].label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {opp.status === "new" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-atlas-signal hover:text-atlas-signal hover:bg-atlas-signal/10"
                          onClick={() => onApprove(opp.id)}
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onReject(opp.id)}
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => onEdit(opp.id)}
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-atlas-cyan hover:text-atlas-cyan hover:bg-atlas-cyan/10"
                          onClick={() => onAskAI(opp.id)}
                          title="Ask Atlas"
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => onViewEvidence(opp.id)}
                          title="View evidence"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {opp.status === "approved" && (
                      <Badge variant="default" className="text-[10px] bg-atlas-signal/15 text-atlas-signal">
                        Approved
                      </Badge>
                    )}
                    {opp.status === "rejected" && (
                      <Badge variant="destructive" className="text-[10px]">
                        Rejected
                      </Badge>
                    )}
                    {opp.status === "edited" && (
                      <Badge variant="secondary" className="text-[10px]">
                        Edited
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-white/[0.02] border-t border-border text-sm space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Rationale</span>
                      <p>{opp.rationale}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Action</span>
                      <p>{opp.action}</p>
                    </div>
                    {opp.risk_flags && opp.risk_flags.length > 0 && (
                      <div>
                        <span className="text-xs text-amber-400">Risk flags</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {opp.risk_flags.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile — card list */}
      <div className="md:hidden space-y-2">
        {opportunities.map((opp) => {
          const isSelected = selectedId === opp.id;
          const isExpanded = expanded.has(opp.id);

          return (
            <Card
              key={opp.id}
              className={cn(
                "panel-atlas border-0 cursor-pointer transition-all",
                isSelected && "ring-1 ring-atlas-cyan/20",
                opp.status === "approved" && "opacity-60",
                opp.status === "rejected" && "opacity-40",
              )}
              onClick={() => onSelect?.(isSelected ? null : opp.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] uppercase", PRIORITY_COLORS[opp.priority])}
                      >
                        {opp.priority}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {opp.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono text-atlas-signal">
                        {formatMoney(opp.amount_cents)}
                      </span>
                      <span>{opp.confidence}% confidence</span>
                      <span>{opp.evidence_count} evidence</span>
                      <span className={COMPLIANCE_COLORS[opp.compliance_status].color}>
                        {COMPLIANCE_COLORS[opp.compliance_status].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {opp.status === "new" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-atlas-signal"
                          onClick={() => onApprove(opp.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onReject(opp.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
