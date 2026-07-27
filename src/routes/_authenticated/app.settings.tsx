// ─── Settings page — Profile + Integration Hub ────────────────────────────────

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { IntegrationCard, type IntegrationCardData } from "@/components/integration-card.tsx";
import {
  IntegrationDashboard,
  type IntegrationDashboardStats,
} from "@/components/integration-dashboard.tsx";
import {
  getProvidersByCategory,
  getProviderMeta,
  connectIntegration as connectViaEngine,
  disconnectIntegration as disconnectViaEngine,
  syncIntegration as syncViaEngine,
  CATEGORY_LABEL,
} from "@/lib/integrations";
import type { IntegrationCategory, ConnectionStatus, SyncStatus } from "@/lib/integrations/types";

/** Loosely-typed Supabase access for tables not yet in generated types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return supabase;
}

// ─── Default seeds — one row per provider, all "disconnected" on first load ───
const DEFAULT_INTEGRATIONS: {
  provider: string;
  category: string;
  label: string;
  logo_url: string | null;
  description: string;
}[] = [];

// Populate defaults from registry
function buildDefaultIntegrations() {
  const grouped = getProvidersByCategory();
  const list: typeof DEFAULT_INTEGRATIONS = [];
  for (const [cat, providers] of Object.entries(grouped)) {
    for (const p of providers) {
      list.push({
        provider: p.provider,
        category: cat,
        label: p.meta?.label ?? p.provider,
        logo_url: p.meta?.logo_url ?? null,
        description: p.meta?.description ?? "",
      });
    }
  }
  return list;
}

export const Route = createFileRoute("/_authenticated/app/settings")({ component: Page });

function Page() {
  // ── Profile state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);

  // ── Integration state ──────────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState<IntegrationCardData[]>([]);
  const [integrationsBusy, setIntegrationsBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      if (p) {
        setFullName(p.full_name ?? "");
        setCompany(p.company_name ?? "");
      }
    });
  }, []);

  async function saveProfile() {
    setProfileBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setProfileBusy(false);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: u.user.id,
      email,
      full_name: fullName,
      company_name: company,
      updated_at: new Date().toISOString(),
    });
    setProfileBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  }

  // ── Load integrations ──────────────────────────────────────────────────────
  const loadIntegrations = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: rows } = await db()
      .from("integrations")
      .select("*")
      .eq("owner_id", userData.user.id);

    const defaults = buildDefaultIntegrations();

    if (!rows || rows.length === 0) {
      // First load — seed the defaults into Supabase
      const toInsert = defaults.map((d) => ({
        owner_id: userData.user.id,
        provider: d.provider,
        category: d.category,
        label: d.label,
        logo_url: d.logo_url,
        status: "disconnected" as ConnectionStatus,
        credentials: null,
        config: {},
        last_sync_at: null,
        last_sync_status: null,
      }));

      const { error: insertErr } = await db().from("integrations").insert(toInsert);
      if (insertErr) {
        // Might be a duplicate race — just reload
        const { data: retry } = await db()
          .from("integrations")
          .select("*")
          .eq("owner_id", userData.user.id);
        if (retry) {
          setIntegrations(retry.map(mapRow));
        }
        return;
      }

      // Re-fetch after insert
      const { data: fresh } = await db()
        .from("integrations")
        .select("*")
        .eq("owner_id", userData.user.id);
      if (fresh) setIntegrations(fresh.map(mapRow));
    } else {
      setIntegrations(rows.map(mapRow));
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  function mapRow(row: Record<string, unknown>): IntegrationCardData {
    const meta = getProviderMeta(row.provider as string);
    return {
      id: row.id as string,
      provider: row.provider as string,
      category: row.category as string,
      label: row.label as string,
      logo_url: (row.logo_url as string) ?? null,
      status: row.status as ConnectionStatus,
      last_sync_at: row.last_sync_at as string | null,
      last_sync_status: row.last_sync_status as SyncStatus | null,
      description: meta?.description ?? "",
    };
  }

  // ── Integration actions ────────────────────────────────────────────────────
  async function handleConnect(provider: string) {
    setIntegrationsBusy(provider);
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration) {
      setIntegrationsBusy(null);
      return;
    }

    // Mock credential dialog — in production this opens an OAuth flow
    const result = await connectViaEngine(
      { id: integration.id, provider, credentials: null, config: {} },
      { api_key: `demo-key-${provider}-${Date.now()}` },
    );

    if (result.ok) {
      toast.success(`${integration.label} connected`);
      await loadIntegrations();
    } else {
      toast.error(result.error ?? "Connection failed");
    }
    setIntegrationsBusy(null);
  }

  async function handleDisconnect(provider: string) {
    setIntegrationsBusy(provider);
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration) {
      setIntegrationsBusy(null);
      return;
    }

    const result = await disconnectViaEngine({
      id: integration.id,
      provider,
      credentials: {},
      config: {},
    });

    if (result.ok) {
      toast.success(`${integration.label} disconnected`);
      await loadIntegrations();
    } else {
      toast.error(result.error ?? "Disconnect failed");
    }
    setIntegrationsBusy(null);
  }

  async function handleSync(provider: string) {
    setIntegrationsBusy(provider);
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration) {
      setIntegrationsBusy(null);
      return;
    }

    const fullIntegration = {
      id: integration.id,
      owner_id: "", // will be filled by the engine from DB
      provider,
      category: integration.category as IntegrationCategory,
      label: integration.label,
      logo_url: integration.logo_url,
      status: integration.status,
      credentials: {},
      config: {},
      last_sync_at: integration.last_sync_at,
      last_sync_status: integration.last_sync_status,
      created_at: "",
      updated_at: "",
    };

    const result = await syncViaEngine(fullIntegration);

    if (result.ok) {
      const d = result.data;
      const total =
        (d?.claims.length ?? 0) +
        (d?.customers.length ?? 0) +
        (d?.estimates.length ?? 0) +
        (d?.documents.length ?? 0) +
        (d?.photos.length ?? 0) +
        (d?.communications.length ?? 0);
      toast.success(`Synced ${total} records from ${integration.label}`);
      await loadIntegrations();
    } else {
      toast.error(result.error ?? "Sync failed");
    }
    setIntegrationsBusy(null);
  }

  // ── Dashboard stats ────────────────────────────────────────────────────────
  function computeStats(): IntegrationDashboardStats {
    const connected = integrations.filter((i) => i.status === "connected");

    // Get sync count from Supabase for this user
    // (We'll compute client-side for now — in production this is a single query)
    const connectedLabels = connected.map((i) => i.label);

    // Fake recent syncs for demo — real impl queries integration_syncs table
    const recentSyncs = connected
      .filter((i) => i.last_sync_at)
      .map((i) => ({
        provider: i.provider,
        label: i.label,
        status: i.last_sync_status ?? "idle",
        at: i.last_sync_at!,
      }))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5);

    const mostRecent = connected
      .map((i) => i.last_sync_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

    return {
      connectedCount: connected.length,
      totalProviders: integrations.length,
      lastSyncLabel: mostRecent ? new Date(mostRecent).toLocaleString() : "Never",
      importedClaims: 3, // demo data — real impl queries imported_claims count
      importedDocuments: 3,
      recentSyncs,
    };
  }

  // ── Group integrations by category for the UI ──────────────────────────────
  function groupedByCategory(): Record<string, IntegrationCardData[]> {
    const grouped: Record<string, IntegrationCardData[]> = {};
    for (const i of integrations) {
      const cat = i.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(i);
    }
    return grouped;
  }

  const stats = computeStats();
  const grouped = groupedByCategory();

  return (
    <AppShell title="Settings" subtitle="Profile, voice, integrations">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">
            Integrations
            {stats.connectedCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-atlas-cyan/20 text-atlas-cyan text-[10px] font-mono">
                {stats.connectedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Profile tab ──────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="panel-atlas border-0">
            <CardContent className="p-6 space-y-4">
              <p className="font-display">Profile</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fn">Full name</Label>
                  <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="co">Company</Label>
                  <Input id="co" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="em">Email</Label>
                <Input id="em" value={email} disabled />
              </div>
              <Button onClick={saveProfile} disabled={profileBusy}>
                {profileBusy ? "Saving…" : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="panel-atlas border-0">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display">Atlas Voice</p>
                <p className="text-sm text-muted-foreground">Enable text-to-speech responses</p>
              </div>
              <Switch
                checked={voiceOn}
                onCheckedChange={setVoiceOn}
                aria-label="Enable Atlas Voice text-to-speech"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integrations tab ─────────────────────────────────────────────── */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Dashboard */}
          <IntegrationDashboard stats={stats} />

          {/* Integration cards grouped by category */}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-3">
              <h2 className="font-display text-sm text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABEL[cat as IntegrationCategory] ?? cat}
              </h2>
              <div className="grid gap-3">
                {items.map((integration) => (
                  <IntegrationCard
                    key={integration.provider}
                    integration={integration}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onSync={handleSync}
                    busy={integrationsBusy === integration.provider}
                  />
                ))}
              </div>
            </div>
          ))}

          {integrations.length === 0 && (
            <Card className="panel-atlas border-0">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="font-display">No integrations available</p>
                <p className="text-sm mt-1">Integration providers will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
