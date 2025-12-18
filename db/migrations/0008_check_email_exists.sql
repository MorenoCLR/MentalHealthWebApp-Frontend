-- Create a function to check if an email exists in auth.users
-- NOTE: This allows email enumeration, which may be a security risk. 
-- Only use if this trade-off is acceptable for your UX.

CREATE OR REPLACE FUNCTION check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = email_to_check
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION check_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO anon, authenticated;
