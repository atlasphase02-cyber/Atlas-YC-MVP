import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware.ts";

export type Recommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  why: string;
  action?: { label: string; route?: string; ask?: string };
  amount_cents?: number;
};

const DAY = 24 * 60 * 60 * 1000;
const OPEN = ["new", "inspection_scheduled", "waiting_on_carrier", "supplement_pending"] as const;

export const generateRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Recommendation[]> => {
    const { supabase } = context;
    const now = Date.now();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday.getTime() + DAY);

    const [claimsRes, supplsRes, apptsRes] = await Promise.all([
      supabase
        .from("claims")
        .select("id, claim_number, status, amount_cents, updated_at, description")
        .in("status", OPEN)
        .order("updated_at", { ascending: true })
        .limit(50),
      supabase
        .from("supplements")
        .select("id, claim_id, status, total_cents, updated_at, summary")
        .in("status", ["draft", "submitted"])
        .order("updated_at", { ascending: true })
        .limit(50),
      supabase
        .from("appointments")
        .select("id, title, starts_at, who, claim_id")
        .gte("starts_at", startToday.toISOString())
        .lt("starts_at", endToday.toISOString())
        .order("starts_at")
        .limit(10),
    ]);

    const recs: Recommendation[] = [];

    // 1. Stalled claims (no update in 5+ days)
    for (const c of (claimsRes.data ?? []) as Array<{
      id: string;
      claim_number: string;
      status: string;
      amount_cents: number;
      updated_at: string;
      description: string | null;
    }>) {
      const ageDays = Math.floor((now - new Date(c.updated_at).getTime()) / DAY);
      if (ageDays >= 5) {
        recs.push({
          id: `stalled-${c.id}`,
          priority: ageDays >= 10 ? "high" : "medium",
          title: `Claim ${c.claim_number} stalled ${ageDays}d`,
          why: `Status ${c.status.replace(/_/g, " ")}. No activity in ${ageDays} days.`,
          amount_cents: c.amount_cents,
          action: { label: "Open claim", route: `/app/claims/${c.id}` },
        });
      }
    }

    // 2. Aging draft supplements (3+ days)
    for (const s of (supplsRes.data ?? []) as Array<{
      id: string;
      claim_id: string;
      status: string;
      total_cents: number;
      updated_at: string;
      summary: string | null;
    }>) {
      const ageDays = Math.floor((now - new Date(s.updated_at).getTime()) / DAY);
      if (s.status === "draft" && ageDays >= 3) {
        recs.push({
          id: `draft-supp-${s.id}`,
          priority: ageDays >= 7 ? "high" : "medium",
          title: `Draft supplement waiting ${ageDays}d`,
          why: `${s.summary ?? "Unsubmitted supplement"}. Total ${(s.total_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}.`,
          amount_cents: s.total_cents,
          action: { label: "Review", route: `/app/supplements/${s.id}` },
        });
      }
      if (s.status === "submitted" && ageDays >= 7) {
        recs.push({
          id: `sub-supp-${s.id}`,
          priority: "medium",
          title: `Follow up on submitted supplement`,
          why: `Submitted ${ageDays}d ago with no response.`,
          amount_cents: s.total_cents,
          action: { label: "Open", route: `/app/supplements/${s.id}` },
        });
      }
    }

    // 3. Appointments today
    for (const a of (apptsRes.data ?? []) as Array<{
      id: string;
      title: string;
      starts_at: string;
      who: string | null;
      claim_id: string | null;
    }>) {
      const when = new Date(a.starts_at);
      if (when.getTime() < now) continue;
      const mins = Math.round((when.getTime() - now) / 60000);
      if (mins <= 240) {
        recs.push({
          id: `appt-${a.id}`,
          priority: mins <= 60 ? "high" : "medium",
          title: `${a.title} in ${mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`}`,
          why: `${when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${a.who ? ` — ${a.who}` : ""}`,
          action: a.claim_id
            ? { label: "Open claim", route: `/app/claims/${a.claim_id}` }
            : { label: "Open calendar", route: "/app/calendar" },
        });
      }
    }

    // Sort by priority then amount
    const rank = { high: 0, medium: 1, low: 2 };
    recs.sort(
      (a, b) =>
        rank[a.priority] - rank[b.priority] || (b.amount_cents ?? 0) - (a.amount_cents ?? 0),
    );
    return recs.slice(0, 8);
  });
