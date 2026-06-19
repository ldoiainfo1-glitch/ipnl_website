-- Supabase schema for IPNL
-- Run this in Supabase SQL Editor or via psql against your database

-- Enable uuid helper
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Profiles (linked to auth.users) ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  company_name text,
  role text DEFAULT 'user',
  tier text DEFAULT 'OBSERVER',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create a profile row after a new auth user is inserted
CREATE OR REPLACE FUNCTION public.handle_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_handle_auth_user ON auth.users;
CREATE TRIGGER trigger_handle_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user();


-- ---------- Mandates ----------
CREATE TABLE IF NOT EXISTS public.mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text,
  title text NOT NULL,
  description text,
  city text,
  state text,
  ticket_size numeric,
  is_off_market boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandates_user_id ON public.mandates(user_id);


-- ---------- Conversations & Messages (basic chat model) ----------
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);


-- ---------- Row Level Security (RLS) ----------
-- Profiles: only owner may select/update/insert their row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- Mandates: public read (marketplace) + owner-only create/update/delete
ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY mandates_select_public ON public.mandates
  FOR SELECT USING (true);

CREATE POLICY mandates_insert_owner ON public.mandates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY mandates_update_owner ON public.mandates
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY mandates_delete_owner ON public.mandates
  FOR DELETE USING (auth.uid() = user_id);


-- Conversations: only participants can see or create conversation including themselves
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select_participant ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY conversations_insert_participant ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE USING (auth.uid() = ANY(participant_ids)) WITH CHECK (auth.uid() = ANY(participant_ids));


-- Messages: only participants in the related conversation can read/insert messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_if_participant ON public.messages
  FOR SELECT USING (auth.uid() = ANY((SELECT participant_ids FROM public.conversations WHERE id = public.messages.conversation_id)));

CREATE POLICY messages_insert_if_participant ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = ANY((SELECT participant_ids FROM public.conversations WHERE id = NEW.conversation_id))); 

CREATE POLICY messages_update_if_sender ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE POLICY messages_delete_if_sender ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);


-- ---------- Convenience: update timestamps trigger ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_on_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_on_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_mandates ON public.mandates;
CREATE TRIGGER set_updated_at_on_mandates
BEFORE UPDATE ON public.mandates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
