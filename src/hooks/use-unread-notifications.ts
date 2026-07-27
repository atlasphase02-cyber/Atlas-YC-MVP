import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { db, currentUserId } from "@/lib/atlas-db.ts";

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const uid = await currentUserId();
      if (!uid || !mounted) return;

      async function refresh() {
        const { count: c } = await db
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null);
        if (mounted) setCount(c ?? 0);
      }
      await refresh();

      channel = supabase
        .channel(`notif:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `owner_id=eq.${uid}` },
          () => {
            refresh();
          },
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
