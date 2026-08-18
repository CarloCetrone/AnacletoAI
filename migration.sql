-- Security Migration Script for Anacleto AI
-- Run this script in your Supabase SQL Editor.

-- 1. Create secure RPC for accepting enterprise invitations
CREATE OR REPLACE FUNCTION public.accept_enterprise_invitation(inv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
  v_username text;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the username for the current user
  SELECT username INTO v_username FROM public.profiles WHERE id = v_user_id;

  -- Get the pending invitation for this user
  SELECT * INTO v_invitation 
  FROM public.enterprise_invitations 
  WHERE id = inv_id AND username = v_username AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, already processed, or belongs to someone else';
  END IF;

  -- Update invitation status
  UPDATE public.enterprise_invitations 
  SET status = 'accepted' 
  WHERE id = inv_id;

  -- Bypass the client restriction trigger for this transaction
  PERFORM set_config('app.bypass_profile_trigger', 'true', true);

  -- Securely link the user to the enterprise and assign credit limit
  UPDATE public.profiles 
  SET enterprise_id = v_invitation.enterprise_id,
      credit_limit = v_invitation.credit_limit
  WHERE id = v_user_id;
END;
$$;

-- 2. Create secure RPC for removing an enterprise member
CREATE OR REPLACE FUNCTION public.remove_enterprise_member(member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enterprise_id uuid;
BEGIN
  v_enterprise_id := auth.uid();
  IF v_enterprise_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the member is currently sponsored by the caller
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = member_id AND enterprise_id = v_enterprise_id
  ) THEN
    RAISE EXCEPTION 'User is not a sponsored member of this enterprise';
  END IF;

  -- Bypass the client restriction trigger for this transaction
  PERFORM set_config('app.bypass_profile_trigger', 'true', true);

  -- Securely sever the link and reset credit limit
  UPDATE public.profiles 
  SET enterprise_id = NULL,
      credit_limit = 0
  WHERE id = member_id;
END;
$$;

-- 3. Fix Row Level Security on token_usage table
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies on token_usage
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'token_usage' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.token_usage', pol.policyname);
    END LOOP;
END
$$;

-- Create the correct SELECT policy that relies on the immutable enterprise_id column
CREATE POLICY "Users can view their own and their sponsored token usage" 
ON public.token_usage 
FOR SELECT 
USING (
  auth.uid() = user_id OR auth.uid() = enterprise_id
);

-- Block arbitrary token inserts/updates from clients
-- (The api_calls edge function bypasses this because it uses the service_role key)
CREATE POLICY "Prevent client inserts on token_usage" 
ON public.token_usage 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Prevent client updates on token_usage" 
ON public.token_usage 
FOR UPDATE 
USING (false);

CREATE POLICY "Prevent client deletes on token_usage" 
ON public.token_usage 
FOR DELETE 
USING (false);

-- 4. Fix Row Level Security on profiles to prevent privilege escalation
-- Note: It is assumed you have policies allowing users to update their own profiles.
-- We must ensure they cannot arbitrarily update their `enterprise_id` or `credit_limit`.
-- Since RPCs with SECURITY DEFINER bypass RLS, we can lock down these columns for standard client updates.

-- Ensure client updates cannot modify enterprise_id or credit_limit
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow updates if they come from our secure RPCs
  IF current_setting('app.bypass_profile_trigger', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- If the update is coming from an authenticated client directly
  IF auth.uid() IS NOT NULL THEN
    -- Block tampering with enterprise data
    IF NEW.enterprise_id IS DISTINCT FROM OLD.enterprise_id OR NEW.credit_limit IS DISTINCT FROM OLD.credit_limit THEN
      RAISE EXCEPTION 'Unauthorized: Cannot arbitrarily modify enterprise_id or credit_limit';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_secure_profile_update ON public.profiles;
CREATE TRIGGER ensure_secure_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update();
