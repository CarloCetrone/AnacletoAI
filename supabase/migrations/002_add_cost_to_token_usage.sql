-- Add cost column to track monthly limit usage
ALTER TABLE public.token_usage ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
