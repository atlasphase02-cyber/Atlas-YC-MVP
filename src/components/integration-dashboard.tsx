// ─── Integration dashboard — summary stats for the integration hub ────────────

import { Card, CardContent } from "@/components/ui/card";
import { Plug, Download, FileText, Clock, Activity } from "lucide-react";

export interface IntegrationDashboardStats {
  connectedCount: number;
  totalProviders: number;
  lastSyncLabel: string;
  importedClaims: number;
  importedDocuments: number;
  recentSyncs: { provider: string; label: string; status: string; at: string }[];
}

interface Props {
  stats: IntegrationDashboardStats;
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="panel-atlas border-0">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-atlas-cyan/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-lg">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground font-mono">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationDashboard({ stats }: Props) {
  return (
    <div className="space-y-4">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Plug className="h-4 w-4 text-atlas-cyan" />}
          label="Connected"
          value={`${stats.connectedCount}/${stats.totalProviders}`}
        />
        <StatCard
          icon={<Download className="h-4 w-4 text-atlas-cyan" />}
          label="Imported Claims"
          value={stats.importedClaims}
        />
        <StatCard
          icon={<FileText className="h-4 w-4 text-atlas-cyan" />}
          label="Documents"
          value={stats.importedDocuments}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-atlas-cyan" />}
          label="Last Sync"
          value={stats.lastSyncLabel}
        />
        <StatCard
          icon={<Activity className="h-4 w-4 text-atlas-cyan" />}
          label="Recent Activity"
          value={stats.recentSyncs.length}
          sub="syncs"
        />
      </div>

      {/* Recent sync log */}
      {stats.recentSyncs.length > 0 && (
        <Card className="panel-atlas border-0">
          <CardContent className="p-4">
            <p className="font-display text-sm mb-3">Recent Sync Activity</p>
            <div className="space-y-2">
              {stats.recentSyncs.map((sync, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sync.label}</span>
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        sync.status === "success"
                          ? "bg-emerald-400"
                          : sync.status === "failed"
                            ? "bg-red-400"
                            : "bg-amber-400"
                      }`}
                    />
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {new Date(sync.at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
