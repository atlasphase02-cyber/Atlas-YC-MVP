import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server.ts";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/ai/executive-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });

        const key = process.env.LOVABLE_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!key || !supabaseUrl || !supabaseKey) return new Response("Server misconfigured", { status: 500 });

        const token = authHeader.slice(7);
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (supabaseKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${supabaseKey}`) h.delete("Authorization");
              h.set("apikey", supabaseKey);
              return fetch(input, { ...init, headers: h });
            },
          },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const claims = ((await supabase.from("claims").select("status, amount_cents, updated_at")).data ?? []) as {
          status: string; amount_cents: number; updated_at: string;
        }[];
        const sups = ((await supabase.from("supplements").select("status, total_cents")).data ?? []) as {
          status: string; total_cents: number;
        }[];
        const appts = ((await supabase.from("appointments").select("kind, starts_at").gte("starts_at", new Date().toISOString()).limit(20)).data ?? []) as {
          kind: string; starts_at: string;
        }[];

        const byStatus: Record<string, number> = {};
        let pipeline = 0;
        let stalled = 0;
        for (const c of claims) {
          byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
          pipeline += c.amount_cents ?? 0;
          const days = (Date.now() - new Date(c.updated_at).getTime()) / 86400000;
          if (days > 14 && c.status !== "closed" && c.status !== "denied") stalled++;
        }
        const supValue = sups.reduce((s, x) => s + (x.total_cents ?? 0), 0);
        const pendingSupps = sups.filter((s) => s.status === "submitted").length;

        const stats = {
          pipeline_usd: Math.round(pipeline / 100),
          claims_total: claims.length,
          claims_by_status: byStatus,
          stalled_claims_over_14d: stalled,
          pending_supplements: pendingSupps,
          supplement_value_usd: Math.round(supValue / 100),
          upcoming_appointments: appts.length,
        };

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.5-flash");
        const result = streamText({
          model,
          system:
            "You are Atlas, an AI operations analyst for insurance restoration companies. " +
            "Write a concise 4-6 sentence executive summary. Highlight what's working, what's stalled, " +
            "and 1-2 recommended actions. Be specific with numbers. No preamble, no markdown headers.",
          prompt: `Business snapshot:\n${JSON.stringify(stats, null, 2)}`,
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
