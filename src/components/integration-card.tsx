// ─── Integration card — single provider row in the integration hub ────────────

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plug,
  Unplug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus, SyncStatus } from "@/lib/integrations/types";
import { CATEGORY_LABEL } from "@/lib/integrations/types";

export interface IntegrationCardData {
  id: string;
  provider: string;
  category: string;
  label: string;
  logo_url: string | null;
  status: ConnectionStatus;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  description: string;
}

interface Props {
  integration: IntegrationCardData;
  onConnect: (provider: string) => void;
  onDisconnect: (provider: string) => void;
  onSync: (provider: string) => void;
  busy?: boolean;
}

/** Fallback logo initial when no logo_url is set. */
function LogoInitial({ label }: { label: string }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-atlas-navy/60 border border-border flex items-center justify-center text-sm font-display text-atlas-cyan shrink-0">
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<
    ConnectionStatus,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    connected: {
      label: "Connected",
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    disconnected: {
      label: "Not Connected",
      icon: <XCircle className="h-3 w-3" />,
      className: "bg-muted/40 text-muted-foreground border-border",
    },
    pending: {
      label: "Connecting…",
      icon: <Clock className="h-3 w-3" />,
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    error: {
      label: "Error",
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    expired: {
      label: "Expired",
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };

  const { label, icon, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function SyncBadge({ status }: { status: SyncStatus | null }) {
  if (!status || status === "idle") return null;

  const config: Record<SyncStatus, { label: string; className: string }> = {
    idle: { label: "", className: "" },
    running: { label: "Syncing…", className: "text-atlas-cyan" },
    success: { label: "Synced", className: "text-emerald-400" },
    partial: { label: "Partial", className: "text-amber-400" },
    failed: { label: "Failed", className: "text-red-400" },
  };

  const { label, className } = config[status];

  return (
    <span className={cn("text-[11px] font-mono", className)}>
      <CircleDot className="inline h-2.5 w-2.5 mr-1" />
      {label}
    </span>
  );
}

export function IntegrationCard({ integration, onConnect, onDisconnect, onSync, busy }: Props) {
  const isConnected = integration.status === "connected";

  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <LogoInitial label={integration.label} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-sm sm:text-base truncate">
                {integration.label}
              </span>
              <StatusBadge status={integration.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CATEGORY_LABEL[integration.category as keyof typeof CATEGORY_LABEL] ??
                integration.category}
              {" · "}
              {integration.description}
            </p>
            {isConnected && integration.last_sync_at && (
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                </span>
                <SyncBadge status={integration.last_sync_status} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onSync(integration.provider)}
                disabled={busy}
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", busy && "animate-spin")} />
                Sync
              </Button>
            )}
            {isConnected ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onDisconnect(integration.provider)}
                disabled={busy}
              >
                <Unplug className="h-3 w-3 mr-1" />
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => onConnect(integration.provider)}
                disabled={busy}
              >
                <Plug className="h-3 w-3 mr-1" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
