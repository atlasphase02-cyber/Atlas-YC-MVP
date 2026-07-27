import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/embeddings";
const MODEL = "google/gemini-embedding-2";

type QueueRow = { id: string; entity_type: string; entity_id: string; attempts: number };

async function embedBatch(inputs: string[]): Promise<number[][]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  // Gemini embedding gateway caps at 100 inputs/request; caller keeps batches small.
  const out: number[][] = [];
  for (const input of inputs) {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, input }),
    });
    if (!res.ok) throw new Error(`Embed ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { data: { embedding: number[] }[] };
    out.push(j.data[0].embedding);
  }
  return out;
}

function toPgVector(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function contentFor(supabase: any, row: QueueRow): Promise<string | null> {
  const t = row.entity_type;
  const id = row.entity_id;
  if (t === "claims") {
    const { data } = await supabase
      .from("claims")
      .select("claim_number, description, status")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    return `Claim ${data.claim_number}. Status: ${data.status}. ${data.description ?? ""}`;
  }
  if (t === "customers") {
    const { data } = await supabase
      .from("customers")
      .select("name, email, phone, address, city, state, notes")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    return `Customer ${data.name}. ${data.email ?? ""} ${data.phone ?? ""} ${data.address ?? ""} ${data.city ?? ""} ${data.state ?? ""}. ${data.notes ?? ""}`;
  }
  if (t === "adjusters") {
    const { data } = await supabase
      .from("adjusters")
      .select("name, email, phone, notes")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    return `Adjuster ${data.name}. ${data.email ?? ""} ${data.phone ?? ""}. ${data.notes ?? ""}`;
  }
  if (t === "documents") {
    const { data } = await supabase
      .from("documents")
      .select("name, folder, tags")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    return `Document ${data.name} in ${data.folder}. Tags: ${(data.tags ?? []).join(", ")}`;
  }
  if (t === "supplements") {
    const { data } = await supabase
      .from("supplements")
      .select("summary, status, ai_summary")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    return `Supplement. Status ${data.status}. ${data.summary ?? ""} ${data.ai_summary ?? ""}`;
  }
  if (t === "notes") {
    const { data } = await supabase.from("notes").select("body").eq("id", id).maybeSingle();
    return data?.body ?? null;
  }
  if (t === "conversations") {
    const { data } = await supabase
      .from("conversations")
      .select("title")
      .eq("id", id)
      .maybeSingle();
    return data?.title ?? null;
  }
  return null;
}

export const processEmbedQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { limit?: number } | undefined) => ({
    limit: Math.min(Math.max(i?.limit ?? 20, 1), 50),
  }))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = context.supabase as any;
    const userId = context.userId;
    const { data: queue, error } = await supabase
      .from("embedding_queue")
      .select("id, entity_type, entity_id, attempts")
      .eq("owner_id", userId)
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) throw error;
    const rows = (queue ?? []) as QueueRow[];
    if (rows.length === 0) return { processed: 0, remaining: 0 };

    let processed = 0;
    for (const row of rows) {
      try {
        const content = await contentFor(supabase, row);
        if (!content || !content.trim()) {
          await supabase.from("embedding_queue").delete().eq("id", row.id);
          continue;
        }
        const [vec] = await embedBatch([content.slice(0, 8000)]);
        const pgv = toPgVector(vec);
        const upd = await supabase
          .from(row.entity_type)
          .update({ embedding: pgv, embedding_updated_at: new Date().toISOString() })
          .eq("id", row.entity_id);
        if (upd.error) throw upd.error;
        await supabase.from("embedding_queue").delete().eq("id", row.id);
        processed++;
      } catch (e) {
        await supabase
          .from("embedding_queue")
          .update({ attempts: row.attempts + 1, last_error: String(e).slice(0, 500) })
          .eq("id", row.id);
      }
    }

    const { count } = await supabase
      .from("embedding_queue")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    return { processed, remaining: count ?? 0 };
  });

export const embedQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { query: string }) => ({ query: String(i.query || "").slice(0, 2000) }))
  .handler(async ({ data }) => {
    if (!data.query.trim()) return { embedding: null as number[] | null };
    const [vec] = await embedBatch([data.query]);
    return { embedding: vec };
  });
