import { supabase } from "@/integrations/supabase/client.ts";

export async function logAudit(
  action: string,
  entity_type?: string,
  entity_id?: string,
  detail?: Record<string, unknown>,
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("audit_logs" as never).insert({
      actor_id: data.user.id,
      actor_email: data.user.email ?? null,
      action,
      entity_type: entity_type ?? null,
      entity_id: entity_id ?? null,
      detail: detail ?? null,
    } as never);
  } catch {
    // audit is best-effort, never block a UI action
  }
}
