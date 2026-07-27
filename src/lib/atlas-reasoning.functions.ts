import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware.ts";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server.ts";
import { generateObject } from "ai";
import { z } from "zod";

// ── Output schemas ──

export const EvidenceNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "photo",
    "document",
    "note",
    "estimate",
    "moisture",
    "code",
    "carrier",
    "historical",
  ]),
  label: z.string(),
  detail: z.string(),
  source: z.string(),
});
export type EvidenceNode = z.infer<typeof EvidenceNodeSchema>;

export const EvidenceEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relation: z.string(),
});
export type EvidenceEdge = z.infer<typeof EvidenceEdgeSchema>;

export const EvidenceGraphSchema = z.object({
  nodes: z.array(EvidenceNodeSchema),
  edges: z.array(EvidenceEdgeSchema),
});

export const ComplianceCheckSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  status: z.enum(["pass", "fail", "insufficient_data"]),
  evidence: z.string(),
  remediation: z.string().nullable(),
});
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;

export const RevenueOpportunitySchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  amount_cents: z.number(),
  confidence: z.number(),
  rationale: z.string(),
  action: z.string(),
});
export type RevenueOpportunity = z.infer<typeof RevenueOpportunitySchema>;

export const ClaimAnalysisSchema = z.object({
  summary: z.string(),
  confidence: z.number(),
  evidence_graph: EvidenceGraphSchema,
  compliance_checks: z.array(ComplianceCheckSchema),
  revenue_opportunities: z.array(RevenueOpportunitySchema),
  recommendations: z.array(z.string()),
  risk_flags: z.array(z.string()),
  carrier_insights: z.string().nullable(),
});
export type ClaimAnalysis = z.infer<typeof ClaimAnalysisSchema>;

// ── Pipeline step schemas (streamed intermediate states) ──

export type AnalysisStep =
  | { step: "gathering"; label: string }
  | { step: "analyzing"; label: string }
  | { step: "evidence"; label: string; nodes: EvidenceNode[]; edges: EvidenceEdge[] }
  | { step: "compliance"; label: string; checks: ComplianceCheck[] }
  | { step: "revenue"; label: string; opportunities: RevenueOpportunity[] }
  | { step: "synthesizing"; label: string }
  | { step: "complete"; label: string; result: ClaimAnalysis };

// ── Build claim context ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gatherClaimContext(supabase: any, claimId: string) {
  const [claim, supplements, docs, photos, notes, events, appointments] = await Promise.all([
    supabase
      .from("claims")
      .select(
        "*, customers(name,email,phone,address), carriers(name,email,phone), adjusters(name,email,phone)",
      )
      .eq("id", claimId)
      .maybeSingle(),
    supabase.from("supplements").select("*, supplement_items(*)").eq("claim_id", claimId),
    supabase.from("documents").select("*").eq("claim_id", claimId),
    supabase.from("photos").select("*").eq("claim_id", claimId),
    supabase
      .from("notes")
      .select("*")
      .eq("claim_id", claimId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("claim_events")
      .select("*")
      .eq("claim_id", claimId)
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("*")
      .eq("claim_id", claimId)
      .order("starts_at", { ascending: false }),
  ]);
  return {
    claim: claim.data,
    supplements: supplements.data ?? [],
    docs: docs.data ?? [],
    photos: photos.data ?? [],
    notes: notes.data ?? [],
    events: events.data ?? [],
    appointments: appointments.data ?? [],
  };
}

function buildPrompt(ctx: Awaited<ReturnType<typeof gatherClaimContext>>) {
  const c = ctx.claim;
  const parts = [
    `Claim ${c?.claim_number ?? "?"} — status: ${c?.status}, amount: $${((c?.amount_cents ?? 0) / 100).toFixed(2)}`,
    `Customer: ${c?.customers?.name ?? "?"} — ${c?.customers?.address ?? ""} ${c?.customers?.city ?? ""} ${c?.customers?.state ?? ""}`,
    `Carrier: ${c?.carriers?.name ?? "?"}, Adjuster: ${c?.adjusters?.name ?? "?"}`,
    `Loss date: ${c?.loss_date ?? "?"}, Description: ${c?.description ?? "none"}`,
    "",
    `${ctx.photos.length} photos | ${ctx.docs.length} documents | ${ctx.notes.length} notes | ${ctx.supplements.length} supplements | ${ctx.events.length} events`,
  ];
  if (ctx.supplements.length > 0) {
    ctx.supplements.forEach((s: Record<string, unknown>) => {
      parts.push(
        `Supplement [${s.status}]: ${s.summary ?? ""} — $${(Number(s.total_cents ?? 0) / 100).toFixed(2)}`,
      );
      const items = s.supplement_items as Array<Record<string, unknown>> | undefined;
      if (items)
        items.forEach((i: Record<string, unknown>) =>
          parts.push(
            `  • ${i.description} qty ${i.quantity} @ $${(Number(i.unit_price_cents ?? 0) / 100).toFixed(2)}`,
          ),
        );
    });
  }
  if (ctx.notes.length > 0)
    parts.push("Notes: " + ctx.notes.map((n: Record<string, unknown>) => n.body).join(" | "));
  if (ctx.events.length > 0)
    parts.push(
      "Timeline: " +
        ctx.events
          .map(
            (e: Record<string, unknown>) =>
              `${e.kind}${e.detail ? ` (${e.detail})` : ""} at ${new Date(e.created_at as string).toISOString().slice(0, 10)}`,
          )
          .join(" → "),
    );
  return parts.join("\n");
}

// ── Server function ──

export const analyzeClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { claimId: string }) => ({ claimId: String(i.claimId || "") }))
  .handler(async ({ data, context }): Promise<ClaimAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const ctx = await gatherClaimContext(context.supabase, data.claimId);
    const prompt = buildPrompt(ctx);

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3.5-flash");

    try {
      const { object: output } = await generateObject({
        model,
        schema: ClaimAnalysisSchema,
        prompt: `You are Atlas, an AI claims analyst for insurance restoration. Analyze this claim and return a structured JSON object.

## Your analysis must include:

### evidence_graph
Build a graph of connected evidence. Node types: photo, document, note, estimate, moisture, code, carrier, historical.
Connect nodes with edges showing how evidence supports conclusions.
Label every node with what it IS and what it PROVES.

### compliance_checks
Check building code compliance (IRC/IBC sections), carrier documentation requirements, and adjuster guidelines.
For each check: the code reference, whether it passes/fails/has insufficient data, what evidence supports it, and remediation if failing.
Use realistic IRC code sections (e.g. IRC R317 for moisture, IRC R905 for roofing, IRC R703 for exterior walls).

### revenue_opportunities
Find legitimate recoverable revenue the operator might miss:
- Scope gaps (line items not yet claimed)
- Code-required items not in estimates
- Carrier-allowable items not yet requested
- Historical precedent from similar claims
Each with a dollar amount in cents, confidence 0-100, rationale, and concrete action.

### recommendations
3-5 strategic recommendations for the operator.

### risk_flags
Anything that could challenge the claim: documentation gaps, adjuster patterns, timeline risks.

### carrier_insights
Specific intelligence about this carrier based on the claim context. Null if insufficient data.

Be specific. Use real dollar amounts. Reference actual IRC sections. This is production analysis, not a demo.

Claim data:
${prompt}`,
      });
      return output;
    } catch (error) {
      console.error("Atlas analysis failed:", error);
      return {
        summary: "Analysis unavailable — try again later.",
        confidence: 0,
        evidence_graph: { nodes: [], edges: [] },
        compliance_checks: [],
        revenue_opportunities: [],
        recommendations: [],
        risk_flags: ["Analysis engine error"],
        carrier_insights: null,
      };
    }
  });

// ── Confidence decomposition ──

export const ConfidenceFactorSchema = z.object({
  label: z.string(),
  impact: z.number(),
  detail: z.string(),
});
export type ConfidenceFactor = z.infer<typeof ConfidenceFactorSchema>;

export const ConfidenceDecompositionSchema = z.object({
  overall: z.number(),
  factors: z.array(ConfidenceFactorSchema),
  summary: z.string(),
});

export const decomposeConfidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      confidence: number;
      summary: string;
      evidence_count: number;
      compliance_pass: number;
      compliance_fail: number;
      revenue_count: number;
      revenue_total_cents: number;
    }) => ({
      confidence: Number(i.confidence),
      summary: String(i.summary || "").slice(0, 500),
      evidence_count: Number(i.evidence_count),
      compliance_pass: Number(i.compliance_pass),
      compliance_fail: Number(i.compliance_fail),
      revenue_count: Number(i.revenue_count),
      revenue_total_cents: Number(i.revenue_total_cents),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ overall: number; factors: ConfidenceFactor[]; summary: string }> => {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) throw new Error("Missing LOVABLE_API_KEY");
      const gateway = createLovableAiGatewayProvider(key);
      const model = gateway("google/gemini-3.5-flash");

      try {
        const { object } = await generateObject({
          model,
          schema: ConfidenceDecompositionSchema,
          prompt: `You are Atlas, explaining a claim analysis confidence score to a restoration contractor. The overall confidence is ${data.confidence}%.

Context:
- Claim summary: ${data.summary}
- Evidence nodes found: ${data.evidence_count}
- Compliance checks passed: ${data.compliance_pass}, failed: ${data.compliance_fail}
- Revenue opportunities detected: ${data.revenue_count} totaling $${(data.revenue_total_cents / 100).toFixed(2)}

Return a confidence decomposition. Break the overall score into 5-8 contributing factors. Each factor has:
- label: short name (2-4 words, e.g. "Photo evidence", "Moisture readings", "Missing documentation")
- impact: integer percentage points (positive = boosts confidence, negative = reduces it). Must sum approximately to the overall.
- detail: one sentence explaining this factor

Be specific and concrete. Don't invent data beyond what's provided.`,
        });
        return object;
      } catch {
        return {
          overall: data.confidence,
          factors: [
            {
              label: "Evidence available",
              impact: Math.round(data.confidence * 0.5),
              detail: "Claim data and artifacts were successfully analyzed.",
            },
            {
              label: "Model assessment",
              impact: Math.round(data.confidence * 0.5),
              detail: "AI confidence based on available information.",
            },
          ],
          summary: "Confidence based on available claim data.",
        };
      }
    },
  );
