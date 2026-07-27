import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  db,
  currentUserId,
  type AppNotification,
  type NotificationPreferences,
} from "@/lib/atlas-db.ts";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/notifications")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as AppNotification[];
    },
  });

  const prefs = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: async (): Promise<NotificationPreferences | null> => {
      const uid = await currentUserId();
      if (!uid) return null;
      const { data, error } = await db
        .from("notification_preferences")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationPreferences | null;
    },
  });

  // Realtime updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;
    (async () => {
      const uid = await currentUserId();
      if (!uid || !mounted) return;
      channel = supabase
        .channel(`notif-list:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `owner_id=eq.${uid}` },
          () => qc.invalidateQueries({ queryKey: ["notifications", "list"] }),
        )
        .subscribe();
    })();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await db
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const updatePrefs = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const { error } = await db.from("notification_preferences").upsert({
        user_id: uid,
        ...(prefs.data ?? {}),
        ...patch,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preferences saved");
      qc.invalidateQueries({ queryKey: ["notification-prefs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unread = data?.filter((n) => !n.read_at).length ?? 0;
  const p =
    prefs.data ??
    ({
      email_enabled: true,
      in_app_enabled: true,
      claim_updates: true,
      supplement_updates: true,
      appointment_reminders: true,
    } as NotificationPreferences);

  async function open(n: AppNotification) {
    if (!n.read_at) markOne.mutate(n.id);
    if (n.link_to) navigate({ to: n.link_to });
  }

  return (
    <PageStub title="Notifications" subtitle={`${unread} unread`} askPrompt="What changed today?">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => markAll.mutate()}
          disabled={!unread || markAll.isPending}
        >
          Mark all read
        </Button>
      </div>

      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="No notifications"
          hint="You'll see real-time activity from your claims here."
        />
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="grid gap-3">
          {data!.map((n) => (
            <Card
              key={n.id}
              className={`panel-atlas border-0 ${!n.read_at ? "ring-1 ring-primary/30" : ""}`}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <button
                  onClick={() => open(n)}
                  className="text-left flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                  aria-label={`Open notification: ${n.title}`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      n.tone === "error"
                        ? "destructive"
                        : n.tone === "warn"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {n.tone}
                  </Badge>
                  {!n.read_at && (
                    <Button variant="ghost" size="sm" onClick={() => markOne.mutate(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="panel-atlas border-0">
        <CardContent className="p-5 space-y-3">
          <p className="font-display">Preferences</p>
          <PrefRow
            label="In-app notifications"
            checked={p.in_app_enabled}
            onChange={(v) => updatePrefs.mutate({ in_app_enabled: v })}
          />
          <PrefRow
            label="Email notifications"
            checked={p.email_enabled}
            onChange={(v) => updatePrefs.mutate({ email_enabled: v })}
          />
          <PrefRow
            label="Claim updates"
            checked={p.claim_updates}
            onChange={(v) => updatePrefs.mutate({ claim_updates: v })}
          />
          <PrefRow
            label="Supplement updates"
            checked={p.supplement_updates}
            onChange={(v) => updatePrefs.mutate({ supplement_updates: v })}
          />
          <PrefRow
            label="Appointment reminders"
            checked={p.appointment_reminders}
            onChange={(v) => updatePrefs.mutate({ appointment_reminders: v })}
          />
        </CardContent>
      </Card>
    </PageStub>
  );
}

function PrefRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
