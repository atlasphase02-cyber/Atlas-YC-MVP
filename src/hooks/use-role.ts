import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";

export type AppRole = "admin" | "manager" | "user";

export function useRoles() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (mounted) setLoading(false); return; }
      const { data } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id", u.user.id);
      if (!mounted) return;
      setRoles(((data as { role: AppRole }[] | null) ?? []).map((r) => r.role));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return {
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isManager: roles.includes("manager") || roles.includes("admin"),
  };
}
