Migration package for MentalHealthWebApp

Files to run (already included in the repo):
- db/migrations/0001_create_users_and_trigger.sql
- db/migrations/0002_enable_rls_and_policies.sql

What to do (copy/paste each SQL file into Supabase SQL Editor and run):

1) Run Migration 0001
- Open Supabase Console -> SQL Editor
- Paste the contents of db/migrations/0001_create_users_and_trigger.sql
- Click Run

2) Run Migration 0002
- Paste the contents of db/migrations/0002_enable_rls_and_policies.sql
- Click Run

3) Update Auth settings (Supabase Console -> Authentication -> Settings):
- Site URL: set to the app's public URL (e.g. https://your-app.example.com)
- Add Redirect URLs (exact):
  - https://your-app.example.com/auth/confirm
  - (optional) https://your-app.example.com/*
- Email settings: configure SMTP (SendGrid/Mailgun/SMTP) if not already configured so confirmation/reset emails are delivered with app links
- Enable "Confirm email" if you want password-login to require confirmation
- Enable Email OTP / Magic Link if you intend to use OTP

Verification checklist (after running SQL + updating Auth):
1. Confirm that `public.users` appears in Supabase -> Database -> Table Editor
2. Sign up via the app with a test email you control
3. Check inbox (and spam) for the confirmation email — click the confirmation link
4. Return to the app and try password login (should succeed if confirmation is required)
5. Test OTP: Click "Send Link" from the app, confirm magic link email points to our app, and verify in-app
6. Test Reset Password: request a reset and ensure reset link points to our app

If anything fails, please provide:
- The error message (or screenshot)
- The confirmation/reset link (you may redact the token)
- Terminal/server logs if available

Security notes:
- Run the SQL as a project DB admin (Supabase SQL Editor has sufficient privileges)
- Do NOT share the `service_role` key publicly

Thanks — run the two scripts, update the Auth settings, then reply with the verification results and any errors.
