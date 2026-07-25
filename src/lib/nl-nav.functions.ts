import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware.ts";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server.ts";
import { generateObject } from "ai";
import { z } from "zod";

const IntentSchema = z.object({
  intent: z.enum(["navigate", "open_entity", "create", "ask", "clarify"]),
  route: z.string().nullable().optional(),
  entity_type: z.enum(["claims", "customers", "adjusters", "supplements", "documents", "appointments"]).nullable().optional(),
  entity_query: z.string().nullable().optional(),
  filters: z.record(z.string(), z.string()).nullable().optional(),
  clarify_question: z.string().nullable().optional(),
  ask_prompt: z.string().nullable().optional(),
});

export type NlIntent = z.infer<typeof IntentSchema>;

const SYSTEM = `You translate a user's natural-language command for the Atlas insurance app into one structured intent.

Valid routes:
- /app  (dashboard)
- /app/claims
- /app/claims/{id}
- /app/supplements
- /app/customers
- /app/adjusters
- /app/documents
- /app/calendar
- /app/analytics
- /app/notifications
- /app/settings
- /app/interview

Rules:
- "Show/list X" → intent="navigate", route to the section, put filters in \`filters\` (e.g. {status:"waiting_on_carrier"}).
- "Open claim NPP-2026-0715" → intent="open_entity", entity_type="claims", entity_query="NPP-2026-0715".
- "Find customers with open claims" or fuzzy searches → intent="open_entity" with entity_type and entity_query.
- "Create a new claim/customer/etc" → intent="create", route to the section (e.g. /app/claims).
- Questions about data, revenue, priorities → intent="ask", ask_prompt = the full question.
- If the command is ambiguous (missing entity type or which record), intent="clarify" with a short clarify_question.
Return only the structured intent — no prose.`;

export const parseNlCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { query: string }) => ({ query: String(i.query || "").slice(0, 500) }))
  .handler(async ({ data }): Promise<NlIntent> => {
    if (!data.query.trim()) return { intent: "clarify", clarify_question: "What would you like to do?" };
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { object } = await generateObject({
      model: gateway("google/gemini-3.5-flash"),
      schema: IntentSchema,
      system: SYSTEM,
      prompt: data.query,
    });
    return object;
  });
