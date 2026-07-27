import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Camera,
  FileText,
  ShieldCheck,
  DollarSign,
  X,
  Link,
  ChevronRight,
  ExternalLink,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

export interface EvidenceItem {
  id: string;
  type: "photo" | "document" | "code" | "estimate" | "inspection" | "carrier" | "manufacturer" | "measurement";
  label: string;
  detail: string;
  date?: string;
  thumbnail_url?: string;
  connected_to: string[];
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  photo: { icon: Camera, label: "Photo", color: "border-sky-500/30 bg-sky-500/5 text-sky-400" },
  document: { icon: FileText, label: "Document", color: "border-violet-500/30 bg-violet-500/5 text-violet-400" },
  code: { icon: ShieldCheck, label: "Code §", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
  estimate: { icon: DollarSign, label: "Estimate", color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
  inspection: { icon: FileText, label: "Inspection", color: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
  carrier: { icon: FileText, label: "Carrier", color: "border-pink-500/30 bg-pink-500/5 text-pink-400" },
  manufacturer: { icon: FileText, label: "Manufacturer", color: "border-orange-500/30 bg-orange-500/5 text-orange-400" },
  measurement: { icon: Ruler, label: "Measurement", color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400" },
};

type Props = {
  items: EvidenceItem[];
  onClose: () => void;
  onItemClick?: (id: string) => void;
};

export function EvidencePanel({ items, onClose, onItemClick }: Props) {
  return (
    <Card className="panel-atlas border-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-atlas-cyan" />
          <h3 className="font-display text-sm">Evidence ({items.length})</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No evidence linked to this recommendation.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Evidence graph visualization — simple connected list */}
            {items.map((item, idx) => {
              const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.document;
              const Icon = config.icon;

              return (
                <div key={item.id}>
                  {idx > 0 && (
                    <div className="flex justify-center py-1">
                      <div className="h-4 w-px bg-border" />
                    </div>
                  )}
                  <button
                    onClick={() => onItemClick?.(item.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3 transition-all hover:bg-white/[0.06] group",
                      config.color,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-white/5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {config.label}
                          </Badge>
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                        {item.date && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(item.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {items.length} evidence items support this recommendation.{" "}
            At least {items.filter((i) => i.type === "code").length} code references,{" "}
            {items.filter((i) => i.type === "photo").length} photos,{" "}
            {items.filter((i) => i.type === "document").length} documents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
