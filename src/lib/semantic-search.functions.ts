import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/embeddings";
const MODEL = "google/gemini-embedding-2";

export type SemanticHit = {
  entity_type:
    "claims" | "customers" | "documents" | "supplements" | "notes" | "adjusters" | "conversations";
  entity_id: string;
  label: string;
  sub: string | null;
  similarity: number;
};

async function embed(input: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, input }),
  });
  if (!res.ok) throw new Error(`Embed ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as { data: { embedding: number[] }[] };
  return j.data[0].embedding;
}

export const semanticSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { query: string; types?: SemanticHit["entity_type"][]; limit?: number }) => ({
    query: String(i.query || "").slice(0, 2000),
    types: i.types,
    limit: Math.min(Math.max(i.limit ?? 10, 1), 25),
  }))
  .handler(async ({ data, context }): Promise<SemanticHit[]> => {
    if (!data.query.trim()) return [];
    const vec = await embed(data.query);
    const pgv = `[${vec.join(",")}]`;
    const { data: rows, error } = await context.supabase.rpc("atlas_semantic_search", {
      p_query: pgv,
      p_owner: context.userId,
      p_limit: data.limit,
      p_types: data.types ?? [
        "claims",
        "customers",
        "documents",
        "supplements",
        "notes",
        "adjusters",
        "conversations",
      ],
    });
    if (error) throw error;
    return (rows ?? []) as SemanticHit[];
  });
