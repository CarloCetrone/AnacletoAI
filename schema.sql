CREATE TABLE public.token_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  model_name text NOT NULL,
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  enterprise_id uuid,
  CONSTRAINT token_usage_pkey PRIMARY KEY (id),
  CONSTRAINT token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT token_usage_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender = ANY (ARRAY['user'::text, 'ai'::text])),
  text text NOT NULL,
  model_used text,
  search_summary text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  account_type text NOT NULL CHECK (account_type = ANY (ARRAY['standard'::text, 'developer'::text, 'enterprise'::text])),
  username text UNIQUE,
  enterprise_name text UNIQUE,
  enterprise_id uuid,
  credit_limit numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  credit_balance numeric DEFAULT 10.00,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.enterprise_invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  enterprise_id uuid,
  username text NOT NULL,
  credit_limit numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT enterprise_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT enterprise_invitations_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES public.profiles(id),
  CONSTRAINT enterprise_invitations_username_fkey FOREIGN KEY (username) REFERENCES public.profiles(username)
);
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  key_value text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone,
  key_name text DEFAULT 'API Secret'::text,
  name text DEFAULT 'API Secret'::text,
  status text DEFAULT 'active'::text,
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
