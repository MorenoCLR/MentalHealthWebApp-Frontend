-- 0002_enable_rls_and_policies.sql
-- Enables RLS on public.users and creates a policy allowing users to manage only their own profile

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to read their own row
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: allow authenticated users to insert their own row (useful in case trigger not present)
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: allow authenticated users to update their own row
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: allow authenticated users to delete their own row (optional)
CREATE POLICY "users_delete_own"
ON public.users
FOR DELETE
USING (auth.uid() = id);

-- Note: If you use the anon/public key from the browser, these RLS policies allow users to manage only their own profile.
-- If you plan to perform server-side writes using the service_role key, do NOT expose that key in the browser.
