-- 0003_create_app_tables_and_policies.sql
-- Creates application tables used by the MentalHealthWebApp and applies RLS policies.
-- Run this after 0001 and 0002.

-- Helper: function to update `updated_at` timestamp on row update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Articles (public readable content)
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  date_published date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT articles_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS articles_date_idx ON public.articles (date_published DESC);
CREATE TRIGGER articles_set_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Goals
CREATE TABLE IF NOT EXISTS public.goal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) > 0),
  target text,
  progress text NOT NULL DEFAULT 'Not Started'::text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goal_pkey PRIMARY KEY (id),
  CONSTRAINT goal_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS goal_user_idx ON public.goal (user_id);
CREATE TRIGGER goal_set_updated_at BEFORE UPDATE ON public.goal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Journal entries
CREATE TABLE IF NOT EXISTS public.journal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) > 0),
  content text,
  date_created date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journal_pkey PRIMARY KEY (id),
  CONSTRAINT journal_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS journal_user_idx ON public.journal (user_id);
CREATE TRIGGER journal_set_updated_at BEFORE UPDATE ON public.journal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Moods
CREATE TABLE IF NOT EXISTS public.moods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood_at timestamptz NOT NULL DEFAULT now(),
  mood_rating integer NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT moods_pkey PRIMARY KEY (id),
  CONSTRAINT moods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS moods_user_idx ON public.moods (user_id);
CREATE TRIGGER moods_set_updated_at BEFORE UPDATE ON public.moods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Physical health
CREATE TABLE IF NOT EXISTS public.physical_health (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  updated_at timestamptz,
  complaints text,
  health_id text,
  CONSTRAINT physical_health_pkey PRIMARY KEY (id),
  CONSTRAINT physical_health_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS physical_health_user_idx ON public.physical_health (user_id);
CREATE TRIGGER physical_health_set_updated_at BEFORE UPDATE ON public.physical_health FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Positive reinforcement messages
CREATE TABLE IF NOT EXISTS public.positive_reinforcement_message (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT positive_reinforcement_message_pkey PRIMARY KEY (id),
  CONSTRAINT positive_reinforcement_message_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS prm_user_idx ON public.positive_reinforcement_message (user_id);
CREATE TRIGGER prm_set_updated_at BEFORE UPDATE ON public.positive_reinforcement_message FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Relaxation suggestions
CREATE TABLE IF NOT EXISTS public.relaxation_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood_id uuid NOT NULL,
  activity_suggestion text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT relaxation_suggestions_pkey PRIMARY KEY (id),
  CONSTRAINT relaxation_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mood_suggestion FOREIGN KEY (mood_id) REFERENCES public.moods(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS relaxation_user_idx ON public.relaxation_suggestions (user_id);
CREATE TRIGGER relaxation_set_updated_at BEFORE UPDATE ON public.relaxation_suggestions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Visualization
CREATE TABLE IF NOT EXISTS public.visualization (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  visualization_id text NOT NULL,
  data integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visualization_pkey PRIMARY KEY (id),
  CONSTRAINT visualization_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS visualization_user_idx ON public.visualization (user_id);
CREATE TRIGGER visualization_set_updated_at BEFORE UPDATE ON public.visualization FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS & policies for per-user tables
-- We'll allow authenticated users to operate on their own rows only

-- List of tables to enable RLS for and add policies
DO $$
DECLARE
  tbl text;
  tables_to_secure text[] := array[
    'goal',
    'journal',
    'moods',
    'physical_health',
    'positive_reinforcement_message',
    'relaxation_suggestions',
    'visualization'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_secure LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    EXECUTE format($pol$
      CREATE POLICY %I_select_own ON public.%I FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY %I_insert_own ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY %I_update_own ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      CREATE POLICY %I_delete_own ON public.%I FOR DELETE USING (auth.uid() = user_id);
    $pol$, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
  END LOOP;
END$$;

-- Articles are public read, but only admins can modify. If you want RLS on articles, adjust as needed.
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY articles_public_select ON public.articles FOR SELECT USING (true);
CREATE POLICY articles_admin_modify ON public.articles FOR ALL USING (auth.role() = 'authenticated' AND false) WITH CHECK (auth.role() = 'authenticated' AND false);

-- Index foreign keys for performance
-- (already created indexes above)

-- Done

COMMENT ON SCHEMA public IS 'Application schema for MentalHealthWebApp.';
