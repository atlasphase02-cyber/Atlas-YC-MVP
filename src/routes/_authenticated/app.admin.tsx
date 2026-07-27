import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/components/route-boundaries.tsx";
import { useRoles, type AppRole } from "@/hooks/use-role.ts";
import { db } from "@/lib/atlas-db.ts";
import { logAudit } from "@/lib/audit.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/admin")({
  component: Page,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

type UserRoleRow = { id: string; user_id: string; role: AppRole; created_at: string };
type AuditRow = {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};
type Settings = {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string | null;
  integrations: Record<string, unknown>;
};

function Page() {
  const { isAdmin, loading } = useRoles();

  if (loading) {
    return (
      <AppShell title="Admin" subtitle="Team, roles, settings, audit">
        <LoadingList rows={3} />
      </AppShell>
    );
  }
  if (!isAdmin) {
    return (
      <AppShell title="Admin" subtitle="Restricted">
        <Card className="panel-atlas border-0 max-w-lg">
          <CardContent className="p-8 text-center space-y-2">
            <ShieldAlert className="mx-auto h-8 w-8 text-atlas-signal" />
            <p className="font-display">Admins only</p>
            <p className="text-sm text-muted-foreground">
              Ask a workspace admin to grant you the admin role to access this area.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin" subtitle="Team, roles, company, and audit trail">
      <Tabs defaultValue="users" className="w-full">
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="users" className="mt-4">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="company" className="mt-4">
          <CompanyPanel />
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <IntegrationsPanel />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditPanel />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "user_roles"],
    queryFn: async () => {
      const [rolesRes, profilesRes] = await Promise.all([
        db.from("user_roles").select("*").order("created_at", { ascending: true }),
        db.from("profiles").select("id, email, full_name, company_name"),
      ]);
      if (rolesRes.error) throw rolesRes.error;
      const roles = (rolesRes.data ?? []) as UserRoleRow[];
      const profiles = (profilesRes.data ?? []) as {
        id: string;
        email: string | null;
        full_name: string | null;
        company_name: string | null;
      }[];
      const byUser = new Map<
        string,
        { email: string | null; full_name: string | null; roles: AppRole[] }
      >();
      for (const p of profiles)
        byUser.set(p.id, { email: p.email, full_name: p.full_name, roles: [] });
      for (const r of roles) {
        const existing = byUser.get(r.user_id) ?? { email: null, full_name: null, roles: [] };
        existing.roles.push(r.role);
        byUser.set(r.user_id, existing);
      }
      return [...byUser.entries()].map(([user_id, v]) => ({ user_id, ...v }));
    },
  });

  async function toggleRole(user_id: string, role: AppRole, currentlyHas: boolean) {
    if (currentlyHas) {
      const { error } = await db
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) return toast.error(error.message);
      await logAudit("role.revoke", "user", user_id, { role });
    } else {
      const { error } = await db.from("user_roles").insert({ user_id, role });
      if (error) return toast.error(error.message);
      await logAudit("role.grant", "user", user_id, { role });
    }
    qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
    toast.success("Role updated");
  }

  if (isLoading) return <LoadingList rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data?.length)
    return <EmptyState title="No users yet" hint="Users will appear as they sign up." />;

  return (
    <div className="grid gap-3">
      {data.map((u) => (
        <Card key={u.user_id} className="panel-atlas border-0">
          <CardContent className="p-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium truncate">{u.full_name ?? u.email ?? u.user_id}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {u.roles.length === 0 && <Badge variant="outline">no role</Badge>}
                {u.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div
              className="flex gap-2 flex-wrap"
              role="group"
              aria-label={`Roles for ${u.email ?? u.user_id}`}
            >
              {(["admin", "manager", "user"] as AppRole[]).map((r) => {
                const has = u.roles.includes(r);
                return (
                  <Button
                    key={r}
                    size="sm"
                    variant={has ? "default" : "outline"}
                    aria-pressed={has}
                    onClick={() => toggleRole(u.user_id, r, has)}
                  >
                    {has ? `✓ ${r}` : `+ ${r}`}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompanyPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "company_settings"],
    queryFn: async () => {
      const { data, error } = await db.from("company_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
  });

  const [form, setForm] = useState<Partial<Settings>>({});
  const merged = { ...(data ?? {}), ...form } as Settings;

  async function save() {
    if (!data?.id) return;
    const patch = {
      name: merged.name,
      logo_url: merged.logo_url,
      primary_color: merged.primary_color,
      contact_email: merged.contact_email,
      contact_phone: merged.contact_phone,
      timezone: merged.timezone,
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("company_settings").update(patch).eq("id", data.id);
    if (error) return toast.error(error.message);
    await logAudit("company.update", "company_settings", data.id, patch);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["admin", "company_settings"] });
    setForm({});
  }

  if (isLoading) return <LoadingList rows={2} />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return <EmptyState title="Company settings not initialized" />;

  return (
    <Card className="panel-atlas border-0 max-w-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cn">Company name</Label>
            <Input
              id="cn"
              value={merged.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="tz">Timezone</Label>
            <Input
              id="tz"
              value={merged.timezone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              placeholder="America/New_York"
            />
          </div>
          <div>
            <Label htmlFor="ce">Contact email</Label>
            <Input
              id="ce"
              type="email"
              value={merged.contact_email ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cp">Contact phone</Label>
            <Input
              id="cp"
              value={merged.contact_phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="lu">Logo URL</Label>
            <Input
              id="lu"
              value={merged.logo_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="pc">Brand color</Label>
            <Input
              id="pc"
              value={merged.primary_color ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
              placeholder="#3B82F6"
            />
          </div>
        </div>
        <Button onClick={save}>Save changes</Button>
      </CardContent>
    </Card>
  );
}

function IntegrationsPanel() {
  const integrations = [
    { key: "supabase", name: "Lovable Cloud (DB + Auth)", status: "connected" },
    { key: "ai_gateway", name: "Lovable AI Gateway (Gemini)", status: "connected" },
    { key: "storage", name: "Cloud Storage (documents + photos)", status: "connected" },
  ];
  return (
    <div className="grid gap-3">
      {integrations.map((i) => (
        <Card key={i.key} className="panel-atlas border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-muted-foreground">Managed by Atlas</p>
            </div>
            <Badge variant="secondary">{i.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AuditPanel() {
  const [q, setQ] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "audit_logs"],
    queryFn: async () => {
      const { data, error } = await db
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });
  const filtered = (data ?? []).filter(
    (r) =>
      !q ||
      `${r.action} ${r.actor_email ?? ""} ${r.entity_type ?? ""}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  if (isLoading) return <LoadingList rows={5} />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  return (
    <div className="space-y-3">
      <label htmlFor="audit-filter" className="sr-only">
        Filter audit log
      </label>
      <Input
        id="audit-filter"
        placeholder="Filter by action, user, entity…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {filtered.length === 0 ? (
        <EmptyState
          title="No audit entries"
          hint="Actions logged from admin surfaces show up here."
        />
      ) : (
        <div className="grid gap-2">
          {filtered.map((r) => (
            <Card key={r.id} className="panel-atlas border-0">
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs">{r.action}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.actor_email ?? "system"} • {r.entity_type ?? "—"}{" "}
                    {r.entity_id ? `#${r.entity_id.slice(0, 8)}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
