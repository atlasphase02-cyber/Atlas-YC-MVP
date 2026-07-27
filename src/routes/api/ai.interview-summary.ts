import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server.ts";

const Schema = z.object({
  summary: z.string(),
  action_items: z.array(
    z.object({
      title: z.string(),
      owner: z.string().nullable(),
      due: z.string().nullable(),
    }),
  ),
  insights: z.string(),
});

type Turn = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/ai/interview-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { transcript?: Turn[] };
        if (!Array.isArray(body.transcript) || body.transcript.length === 0) {
          return new Response("Transcript required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3.5-flash");

        const conv = body.transcript
          .map((t) => `${t.role === "user" ? "Customer" : "Atlas"}: ${t.content}`)
          .join("\n");

        try {
          const { output } = await generateText({
            model,
            output: Output.object({ schema: Schema }),
            prompt: `You are Atlas summarizing an insurance restoration intake interview. Read the transcript and return:
- summary: 3-5 sentences capturing loss type, property, timeline, and open questions
- action_items: concrete next steps for the operator (owner and due may be null)
- insights: risks, red flags, coverage angles, or unusual details

Transcript:
${conv}`,
          });
          return Response.json(output);
        } catch (error) {
          if (NoObjectGeneratedError.isInstance(error)) {
            return Response.json({ summary: error.text ?? "", action_items: [], insights: "" });
          }
          throw error;
        }
      },
    },
  },
});
