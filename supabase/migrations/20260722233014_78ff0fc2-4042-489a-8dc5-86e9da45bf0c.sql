
-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding + tracking columns to indexed entities
ALTER TABLE public.claims          ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.claims          ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE public.customers       ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.customers       ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE public.adjusters       ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.adjusters       ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE public.supplements     ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.supplements     ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE public.notes           ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.notes           ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;
ALTER TABLE public.conversations   ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE public.conversations   ADD COLUMN IF NOT EXISTS embedding_updated_at timestamptz;

-- 3. Halfvec HNSW indexes (pgvector caps direct hnsw at 2000 dims; use halfvec cast for 3072)
CREATE INDEX IF NOT EXISTS claims_embedding_idx        ON public.claims        USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
CREATE INDEX IF NOT EXISTS customers_embedding_idx     ON public.customers     USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
CREATE INDEX IF NOT EXISTS adjusters_embedding_idx     ON public.adjusters     USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
CREATE INDEX IF NOT EXISTS documents_embedding_idx     ON public.documents     USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
CREATE INDEX IF NOT EXISTS supplements_embedding_idx   ON public.supplements   USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
CREATE INDEX IF NOT EXISTS notes_embedding_idx         ON public.notes         USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
CREATE INDEX IF NOT EXISTS conversations_embedding_idx ON public.conversations USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

-- 4. Embedding queue
CREATE TABLE IF NOT EXISTS public.embedding_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS embedding_queue_owner_idx ON public.embedding_queue (owner_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.embedding_queue TO authenticated;
GRANT ALL ON public.embedding_queue TO service_role;

ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own embed queue" ON public.embedding_queue;
CREATE POLICY "own embed queue" ON public.embedding_queue FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 5. Enqueue trigger (generic)
CREATE OR REPLACE FUNCTION public.enqueue_embedding()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  VALUES (NEW.owner_id, TG_TABLE_NAME, NEW.id)
  ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET created_at = now(), attempts = 0, last_error = NULL;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.enqueue_embedding() FROM PUBLIC, authenticated;

DROP TRIGGER IF EXISTS enqueue_embedding_claims        ON public.claims;
DROP TRIGGER IF EXISTS enqueue_embedding_customers     ON public.customers;
DROP TRIGGER IF EXISTS enqueue_embedding_adjusters     ON public.adjusters;
DROP TRIGGER IF EXISTS enqueue_embedding_documents     ON public.documents;
DROP TRIGGER IF EXISTS enqueue_embedding_supplements   ON public.supplements;
DROP TRIGGER IF EXISTS enqueue_embedding_notes         ON public.notes;
DROP TRIGGER IF EXISTS enqueue_embedding_conversations ON public.conversations;

CREATE TRIGGER enqueue_embedding_claims        AFTER INSERT OR UPDATE ON public.claims        FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();
CREATE TRIGGER enqueue_embedding_customers     AFTER INSERT OR UPDATE ON public.customers     FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();
CREATE TRIGGER enqueue_embedding_adjusters     AFTER INSERT OR UPDATE ON public.adjusters     FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();
CREATE TRIGGER enqueue_embedding_documents     AFTER INSERT OR UPDATE ON public.documents     FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();
CREATE TRIGGER enqueue_embedding_supplements   AFTER INSERT OR UPDATE ON public.supplements   FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();
CREATE TRIGGER enqueue_embedding_notes         AFTER INSERT OR UPDATE ON public.notes         FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();
CREATE TRIGGER enqueue_embedding_conversations AFTER INSERT OR UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.enqueue_embedding();

-- 6. Backfill queue with existing rows
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'claims',        id FROM public.claims        WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'customers',     id FROM public.customers     WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'adjusters',     id FROM public.adjusters     WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'documents',     id FROM public.documents     WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'supplements',   id FROM public.supplements   WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'notes',         id FROM public.notes         WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;
INSERT INTO public.embedding_queue (owner_id, entity_type, entity_id)
  SELECT owner_id, 'conversations', id FROM public.conversations WHERE owner_id IS NOT NULL ON CONFLICT DO NOTHING;

-- 7. Cross-entity semantic search RPC (owner-scoped; RLS also applies)
CREATE OR REPLACE FUNCTION public.atlas_semantic_search(
  p_query vector(3072),
  p_owner uuid,
  p_limit int DEFAULT 10,
  p_types text[] DEFAULT ARRAY['claims','customers','documents','supplements','notes','adjusters','conversations']
) RETURNS TABLE (
  entity_type text,
  entity_id uuid,
  label text,
  sub text,
  similarity float
) LANGUAGE sql STABLE SET search_path = public AS $$
  WITH ranked AS (
    SELECT 'claims'::text AS entity_type, id AS entity_id,
           claim_number AS label, description AS sub,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072)) AS similarity
      FROM public.claims
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'claims' = ANY(p_types)
    UNION ALL
    SELECT 'customers', id, name, email,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072))
      FROM public.customers
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'customers' = ANY(p_types)
    UNION ALL
    SELECT 'adjusters', id, name, email,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072))
      FROM public.adjusters
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'adjusters' = ANY(p_types)
    UNION ALL
    SELECT 'documents', id, name, folder,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072))
      FROM public.documents
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'documents' = ANY(p_types)
    UNION ALL
    SELECT 'supplements', id, COALESCE(summary,'Supplement'), status::text,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072))
      FROM public.supplements
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'supplements' = ANY(p_types)
    UNION ALL
    SELECT 'notes', id, LEFT(body, 80), NULL,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072))
      FROM public.notes
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'notes' = ANY(p_types)
    UNION ALL
    SELECT 'conversations', id, title, NULL,
           1 - (embedding::halfvec(3072) <=> p_query::halfvec(3072))
      FROM public.conversations
     WHERE owner_id = p_owner AND embedding IS NOT NULL AND 'conversations' = ANY(p_types)
  )
  SELECT entity_type, entity_id, label, sub, similarity
    FROM ranked
   ORDER BY similarity DESC
   LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.atlas_semantic_search(vector, uuid, int, text[]) TO authenticated, service_role;
