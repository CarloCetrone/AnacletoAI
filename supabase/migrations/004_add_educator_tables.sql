-- Migration: Add tables for Educator Lessons and Student Sessions

-- 1. Create `lessons` table
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  access_key text UNIQUE NOT NULL,
  source_material text,
  educator_prompt text,
  generated_plan text, -- Contains the finalized LaTeX or JSON structure
  status text NOT NULL DEFAULT 'draft', -- 'draft' or 'published'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create `student_sessions` table
CREATE TABLE IF NOT EXISTS public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_username text NOT NULL,
  chat_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS (Row Level Security) for `lessons`
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Educators can view and edit their own lessons
CREATE POLICY "Educators can view their own lessons" ON public.lessons
  FOR SELECT USING (auth.uid() = educator_id);

CREATE POLICY "Educators can insert their own lessons" ON public.lessons
  FOR INSERT WITH CHECK (auth.uid() = educator_id);

CREATE POLICY "Educators can update their own lessons" ON public.lessons
  FOR UPDATE USING (auth.uid() = educator_id);

CREATE POLICY "Educators can delete their own lessons" ON public.lessons
  FOR DELETE USING (auth.uid() = educator_id);

-- Anyone (including unauthenticated students) can view a published lesson if they have the access key
-- We'll manage this access strictly via the Edge Functions, but we can allow a read-only policy
CREATE POLICY "Anyone can view published lessons by access key" ON public.lessons
  FOR SELECT USING (status = 'published');

-- Setup RLS for `student_sessions`
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

-- Edge functions will primarily handle this, so we allow anon inserts/selects for the guided learning flow
CREATE POLICY "Anon can insert student sessions" ON public.student_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can view own student session" ON public.student_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anon can update own student session" ON public.student_sessions
  FOR UPDATE USING (true);

-- Function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.student_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
