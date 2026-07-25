-- ================= Conversations =================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  page_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_owner_all" ON public.conversations FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX conversations_owner_recent_idx
  ON public.conversations (owner_id, archived_at NULLS FIRST, last_message_at DESC);
CREATE TRIGGER trg_conversations_touch BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ================= Messages =================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  parts JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_owner_all" ON public.messages FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX messages_conv_idx ON public.messages (conversation_id, created_at);

-- Bump conversation last_message_at + auto-title on first user message
CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  cur_title TEXT;
BEGIN
  UPDATE public.conversations
    SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.conversation_id
    RETURNING title INTO cur_title;
  IF NEW.role = 'user' AND (cur_title IS NULL OR cur_title = 'New conversation') THEN
    UPDATE public.conversations
      SET title = LEFT(regexp_replace(NEW.content, E'\\s+', ' ', 'g'), 60)
      WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.on_message_insert() FROM public, authenticated;
CREATE TRIGGER trg_messages_bump AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_insert();

-- ================= Voice preferences =================
CREATE TABLE public.voice_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_name TEXT,
  rate NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (rate BETWEEN 0.5 AND 2.0),
  pitch NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (pitch BETWEEN 0.5 AND 2.0),
  muted BOOLEAN NOT NULL DEFAULT false,
  mode TEXT NOT NULL DEFAULT 'tap' CHECK (mode IN ('tap','ptt','hands_free')),
  auto_send_transcripts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_preferences TO authenticated;
GRANT ALL ON public.voice_preferences TO service_role;
ALTER TABLE public.voice_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_pref_owner_all" ON public.voice_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_voice_pref_touch BEFORE UPDATE ON public.voice_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ================= Interviews =================
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New interview',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  insights TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interviews_owner_all" ON public.interviews FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX interviews_owner_recent_idx
  ON public.interviews (owner_id, status, updated_at DESC);
CREATE TRIGGER trg_interviews_touch BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ================= Supplement AI metadata =================
ALTER TABLE public.supplement_items
  ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_confidence INT CHECK (ai_confidence BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ai_reason TEXT;

ALTER TABLE public.supplements
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb;