import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Brain,
  FileText,
  Camera,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  DollarSign,
  ChevronRight,
  Sparkles,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { formatMoney } from "@/lib/atlas-db.ts";

export interface ReasoningEvidence {
  id: string;
  type: "photo" | "document" | "code" | "estimate" | "inspection" | "carrier" | "manufacturer";
  label: string;
  detail: string;
}

export interface ReasoningData {
  summary: string;
  confidence: number;
  reasoning: string;
  evidence: ReasoningEvidence[];
  missingInformation: string[];
  possibleRisks: string[];
  requiredDocumentation: string[];
  potentialAdjusterObjection: string | null;
  suggestedResponse: string | null;
  estimatedRevenue: number;
}

const EVIDENCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  document: FileText,
  code: ShieldCheck,
  estimate: DollarSign,
  inspection: FileText,
  carrier: FileText,
  manufacturer: FileText,
};

const EVIDENCE_LABELS: Record<string, string> = {
  photo: "Photo",
  document: "Document",
  code: "Code §",
  estimate: "Estimate",
  inspection: "Inspection",
  carrier: "Carrier",
  manufacturer: "Manufacturer",
};

type Props = {
  data: ReasoningData | null;
  onAskFollowUp?: (question: string) => void;
};

export function AIReasoningPanel({ data, onAskFollowUp }: Props) {
  if (!data) {
    return (
      <Card className="panel-atlas border-0">
        <CardContent className="p-8 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Select a revenue opportunity to see Atlas's reasoning.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="panel-atlas border-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-atlas-violet" />
          <h3 className="font-display text-sm">Atlas Reasoning</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span
            className={cn(
              "font-mono text-sm font-bold",
              data.confidence >= 90
                ? "text-atlas-signal"
                : data.confidence >= 70
                  ? "text-amber-400"
                  : "text-destructive",
            )}
          >
            {data.confidence}%
          </span>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Summary */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Reasoning
          </p>
          <p className="text-sm leading-relaxed">{data.reasoning}</p>
        </div>

        {/* Evidence chain */}
        {data.evidence.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Evidence Used
            </p>
            <div className="space-y-2">
              {data.evidence.map((e) => {
                const Icon = EVIDENCE_ICONS[e.type] ?? FileText;
                return (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition group cursor-pointer"
                  >
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-atlas-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {EVIDENCE_LABELS[e.type]}
                        </Badge>
                        <span className="text-sm font-medium truncate">{e.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>
                    </div>
                    <Link className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing information */}
        {data.missingInformation.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
              <HelpCircle className="h-3 w-3" />
              Missing Information
            </p>
            <ul className="space-y-1">
              {data.missingInformation.map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {data.possibleRisks.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-destructive mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Possible Risks
            </p>
            <ul className="space-y-1">
              {data.possibleRisks.map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required documentation */}
        {data.requiredDocumentation.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Required Documentation
            </p>
            <ul className="space-y-1">
              {data.requiredDocumentation.map((d, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-atlas-cyan mt-0.5">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Adjuster objection */}
        {data.potentialAdjusterObjection && (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3">
            <p className="text-xs uppercase tracking-widest text-amber-400 mb-1">
              Potential Adjuster Objection
            </p>
            <p className="text-xs text-muted-foreground">{data.potentialAdjusterObjection}</p>
            {data.suggestedResponse && (
              <>
                <p className="text-xs uppercase tracking-widest text-atlas-signal mt-2 mb-1">
                  Suggested Response
                </p>
                <p className="text-xs text-muted-foreground">{data.suggestedResponse}</p>
              </>
            )}
          </div>
        )}

        {/* Estimated revenue */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-atlas-signal/5 border border-atlas-signal/15">
          <span className="text-xs text-muted-foreground">Estimated Recovery</span>
          <span className="font-mono text-atlas-signal font-bold">
            {formatMoney(data.estimatedRevenue)}
          </span>
        </div>

        {/* Follow-up */}
        {onAskFollowUp && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onAskFollowUp("Why is this compliant?")}
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Why compliant?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onAskFollowUp("What happens if the adjuster pushes back?")}
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              Adjuster pushback?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onAskFollowUp("Show me the relevant building codes")}
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Building codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
