-- Create api_keys table for Developer & Enterprise accounts
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL DEFAULT 'API Secret',
  key_value TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Ensure key_name column exists if table was created previously without it
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_name TEXT DEFAULT 'API Secret';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'API Secret';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_value TEXT;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Index for fast key lookup during API request authentication
CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON public.api_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Enable Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Developers can only view, create, update, and delete their own keys
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
CREATE POLICY "Users can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update status of their own API keys" ON public.api_keys;
CREATE POLICY "Users can update status of their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
