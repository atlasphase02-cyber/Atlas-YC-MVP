import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server.ts";

const Schema = z.object({
  summary: z.string(),
  confidence: z.number(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unit_price_cents: z.number(),
      confidence: z.number(),
      reason: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
});

export const Route = createFileRoute("/api/ai/supplement-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          claim_summary?: string;
          existing_items?: { description: string; quantity: number; unit_price_cents: number }[];
          notes?: string;
        };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.5-flash");

        const existing =
          (body.existing_items ?? [])
            .map(
              (i) =>
                `- ${i.description} (qty ${i.quantity} @ $${(i.unit_price_cents / 100).toFixed(2)})`,
            )
            .join("\n") || "(none)";

        try {
          const { output } = await generateText({
            model,
            output: Output.object({ schema: Schema }),
            prompt: `You are Atlas, an AI supplement writer for insurance restoration claims. Given the claim context, propose supplement line items that are commonly missed or under-scoped.

Rules:
- Prices in whole cents (unit_price_cents). Use realistic Xactimate-style unit costs for US restoration work.
- confidence values are integers 0-100.
- Keep items specific and defensible. Don't duplicate existing items.
- recommendations: short strategic tips for the operator (photos to capture, code items to cite, carrier communication tips).

Claim summary:
${body.claim_summary ?? "(none provided)"}

Additional notes:
${body.notes ?? "(none)"}

Existing line items:
${existing}`,
          });
          return Response.json(output);
        } catch (error) {
          if (NoObjectGeneratedError.isInstance(error)) {
            return Response.json({ summary: "", confidence: 0, items: [], recommendations: [] });
          }
          throw error;
        }
      },
    },
  },
});
