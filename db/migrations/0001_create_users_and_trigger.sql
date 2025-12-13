-- 0001_create_users_and_trigger.sql
-- Creates public.users table and adds a trigger to insert a profile row when a new auth.user is created

-- Create users table if it does not exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  phone_number text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Trigger function to insert a stub profile row for new auth users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, updated_at)
  VALUES (NEW.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS auth_user_created ON auth.users;
CREATE TRIGGER auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
