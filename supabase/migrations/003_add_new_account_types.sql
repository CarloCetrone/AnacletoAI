-- Drop the existing constraint on profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add the new constraint including 'creator' and 'educator'
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type = ANY (ARRAY['standard'::text, 'developer'::text, 'enterprise'::text, 'creator'::text, 'educator'::text]));
