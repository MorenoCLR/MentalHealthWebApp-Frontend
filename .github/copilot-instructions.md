# Mental Health Web App - AI Agent Instructions

## Project Overview

This is a **Next.js 16 (App Router) + Supabase** mental health web application with cookie-based authentication. The project uses TypeScript, Tailwind CSS 4, and the `@supabase/ssr` package for server-side rendering with Supabase.

## Architecture & Key Components

### Supabase Client Contexts

**Critical**: This app uses THREE different Supabase client initialization patterns:

1. **Server Components/Actions** → [`utils/supabase/server.ts`](utils/supabase/server.ts)
   - Uses `createServerClient` with Next.js `cookies()` API
   - Environment vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (no `NEXT_PUBLIC_` prefix)
   - Always `await createClient()` before use

2. **Client Components** → [`utils/supabase/client.ts`](utils/supabase/client.ts)
   - Uses `createBrowserClient` 
   - Environment vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Direct call: `createClient()` (no await)

3. **Middleware** → [`utils/supabase/middleware.ts`](utils/supabase/middleware.ts)
   - Special cookie handling for auth token refresh
   - Called from [`proxy.ts`](proxy.ts) (Next.js middleware entry point)

### Authentication Patterns

- **Dual auth system**: Password-based AND OTP (one-time password) flows coexist
- **Server Actions** in [`app/login/actions.ts`](app/login/actions.ts) handle: `login()`, `signup()`, `sendOtp()`, `verifyOtp()`
- **Client-side helpers** in [`app/login/clientAuth.ts`](app/login/clientAuth.ts) mirror server actions for client component use
- **API Route** at [`app/api/auth/login/route.ts`](app/api/auth/login/route.ts) handles form POST from login page
- **Auth callback** at [`app/auth/confirm/route.ts`](app/auth/confirm/route.ts) processes email confirmation redirects

**Important**: Auth redirects use `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm` pattern consistently.

### Database Schema

See [`db/migrations/`](db/migrations/) for complete schema:
- **RLS enabled** on all tables (Row-Level Security)
- Core tables: `users`, `goal`, `journal`, `articles`, `exercises`, `mood_logs`
- All tables use `uuid` primary keys with `gen_random_uuid()` default
- Foreign keys cascade delete from `users` table
- Trigger-based `updated_at` timestamp maintenance via `set_updated_at()` function

## Development Workflows

### Running Locally
```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm run start      # Run production build
npm run lint       # ESLint check
```

### Environment Variables Required

Create `.env.local`:
```env
# Server-side only (NO NEXT_PUBLIC_ prefix)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...

# Client-side (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbG...  # Can use anon key during transition
NEXT_PUBLIC_APP_URL=http://localhost:3000      # Optional, for auth redirects
```

**Note**: Both `SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*` vars must be set with same values.

## Code Conventions

### File Organization
- **Server Actions**: Use `'use server'` directive, place in `actions.ts` files
- **Client Components**: Use `'use client'` directive, interactive UI components
- **API Routes**: Use `route.ts` files in `app/api/` directory structure
- **Path Aliases**: Use `@/` prefix for imports (maps to project root via tsconfig)

### Component Patterns
- Login page uses **mode-based UI state**: `"password" | "otp" | "forgot" | "resend"`
- Form submissions prefer **Server Actions** over API routes where possible
- Client-side Supabase calls wrapped in dedicated helper functions ([`clientAuth.ts`](app/login/clientAuth.ts))

### Styling
- **Tailwind CSS 4** with PostCSS (see [`postcss.config.mjs`](postcss.config.mjs))
- Custom color palette: `#A4B870` (primary green), `#6E8450` (dark green), `#F5F5F0` (background)
- Geist Sans + Geist Mono fonts loaded in [`layout.tsx`](app/layout.tsx)

### TypeScript Configuration
- Strict mode enabled
- Path mapping: `@/*` resolves to workspace root
- Target: ES2017, JSX runtime: `react-jsx`

## Common Tasks

### Adding a New Protected Page
1. Create page in `app/[route]/page.tsx`
2. Import server Supabase client: `import { createClient } from '@/utils/supabase/server'`
3. Check auth: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()`
4. Redirect if not authenticated

### Creating a New Database Table
1. Add SQL migration in `db/migrations/NNNN_description.sql`
2. Include RLS policies: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
3. Add user-scoped policy: `CREATE POLICY ... ON ... USING (user_id = auth.uid())`
4. Add `updated_at` trigger if needed

### Adding a Server Action
1. Create in `[route]/actions.ts` with `'use server'` directive
2. Import server client: `const supabase = await createClient()`
3. Perform operation, then call `revalidatePath('/', 'layout')` if data changes
4. Use `redirect()` for navigation (not `router.push()`)

## Debugging Tips

- Server logs appear in terminal, client logs in browser console
- Auth issues: Check cookie settings in Network tab (should see `sb-*` cookies)
- RLS errors: Verify user is authenticated AND policies match `auth.uid()`
- Environment var mismatch causes "Invalid API key" errors

## Known Patterns & Quirks

- **Middleware updates auth session** on every request via [`proxy.ts`](proxy.ts)
- **ESLint config** uses new flat config format ([`eslint.config.mjs`](eslint.config.mjs))
- **Migration package** in workspace is for external sharing (ignore for dev)
- **No middleware.ts in root**: Middleware is at `proxy.ts` due to project structure choice
