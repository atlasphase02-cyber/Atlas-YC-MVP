import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server.ts";

const SYSTEM_PROMPT = `You are Atlas — the AI Operating System for insurance restoration companies.
You sit above the customer's existing stack (CRM, estimating, claims, photos, documents, emails, notes, supplements, team knowledge) and turn it into one connected intelligence layer.

Speak like a senior operations manager: direct, calm, specific, warm. Short sentences. No filler. No emojis. Use concrete numbers whenever possible.

You can help with:
- Reviewing today's priorities, revenue at risk, and pipeline health
- Finding claims waiting on carriers, adjusters, or supplements
- Drafting supplements, letters, and follow-ups
- Answering "where does the business stand right now?"

When you don't have live data, say so and describe what you would look at. Never invent claim numbers, customers, or dollar amounts.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; context?: string; systemExtra?: string };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.5-flash");

        const parts = [SYSTEM_PROMPT];
        if (body.systemExtra) parts.push(body.systemExtra);
        if (body.context) parts.push(`Current page context: ${body.context}`);
        const system = parts.join("\n\n");

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});
