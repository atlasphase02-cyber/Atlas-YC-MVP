-- Atlas Integration Hub — Phase 5 schema
-- Tables: integrations, integration_syncs, webhooks, imported_*

-- ============ Integrations ============
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  credentials JSONB,
  config JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_own" ON public.integrations FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX integrations_owner_status_idx ON public.integrations(owner_id, status);

-- ============ Integration Syncs ============
CREATE TABLE IF NOT EXISTS public.integration_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'import',
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  records_imported INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_syncs TO authenticated;
GRANT ALL ON public.integration_syncs TO service_role;
ALTER TABLE public.integration_syncs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_syncs_own" ON public.integration_syncs FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX integration_syncs_integration_idx ON public.integration_syncs(integration_id, started_at DESC);

-- ============ Webhooks ============
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_own" ON public.webhooks FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX webhooks_integration_idx ON public.webhooks(integration_id, created_at DESC);

-- ============ Imported Claims ============
CREATE TABLE IF NOT EXISTS public.imported_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  claim_number TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  property_address TEXT,
  carrier_name TEXT,
  adjuster_name TEXT,
  loss_date DATE,
  amount_cents BIGINT,
  status TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_claims TO authenticated;
GRANT ALL ON public.imported_claims TO service_role;
ALTER TABLE public.imported_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_claims_own" ON public.imported_claims FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX imported_claims_owner_idx ON public.imported_claims(owner_id, imported_at DESC);

-- ============ Imported Customers ============
CREATE TABLE IF NOT EXISTS public.imported_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_customers TO authenticated;
GRANT ALL ON public.imported_customers TO service_role;
ALTER TABLE public.imported_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_customers_own" ON public.imported_customers FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ Imported Estimates ============
CREATE TABLE IF NOT EXISTS public.imported_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  claim_number TEXT,
  total_cents BIGINT NOT NULL DEFAULT 0,
  line_items JSONB NOT NULL DEFAULT '[]',
  raw_payload JSONB NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_estimates TO authenticated;
GRANT ALL ON public.imported_estimates TO service_role;
ALTER TABLE public.imported_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_estimates_own" ON public.imported_estimates FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ Imported Documents ============
CREATE TABLE IF NOT EXISTS public.imported_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  url TEXT,
  claim_number TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_documents TO authenticated;
GRANT ALL ON public.imported_documents TO service_role;
ALTER TABLE public.imported_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_documents_own" ON public.imported_documents FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ Imported Photos ============
CREATE TABLE IF NOT EXISTS public.imported_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  caption TEXT,
  url TEXT,
  claim_number TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_photos TO authenticated;
GRANT ALL ON public.imported_photos TO service_role;
ALTER TABLE public.imported_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_photos_own" ON public.imported_photos FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ Imported Communications ============
CREATE TABLE IF NOT EXISTS public.imported_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  from_address TEXT,
  to_address TEXT,
  sent_at TIMESTAMPTZ,
  claim_number TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_communications TO authenticated;
GRANT ALL ON public.imported_communications TO service_role;
ALTER TABLE public.imported_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_communications_own" ON public.imported_communications FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ updated_at trigger for integrations ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'integrations_touch'
  ) THEN
    CREATE TRIGGER integrations_touch BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;
