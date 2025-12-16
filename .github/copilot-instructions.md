# Mental Health Web App - AI Agent Instructions

## Project Overview
Next.js 16 (App Router) + Supabase mental health web app with cookie-based auth, TypeScript, Tailwind CSS 4, and `@supabase/ssr` for server-side rendering. Users track mood, goals, journal entries, and wellness metrics with dynamic UI reflecting their emotional state.

## Critical: Three Supabase Client Patterns

**You MUST use the correct client for each context** - mixing these causes auth failures:

1. **Server Components/Actions** → `@/utils/supabase/server`
   ```ts
   import { createClient } from '@/utils/supabase/server'
   const supabase = await createClient()  // Always await!
   ```
   - Environment vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (no `NEXT_PUBLIC_` prefix in server env)
   - Used in: Server actions (`actions.ts`), API routes `/app/api/auth/*`, `/app/auth/confirm`
   - Example: Auth checks, RLS-protected queries, session management

2. **Client Components** → `@/utils/supabase/client`
   ```ts
   import { createClient } from '@/utils/supabase/client'
   const supabase = createClient()  // No await
   ```
   - Environment vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Used in: Client components with `'use client'` directive only
   - Example: Client-side auth helpers in `clientAuth.ts`

3. **Middleware** → `@/utils/supabase/middleware`
   - Special cookie handling for auth token refresh
   - Called from `proxy.ts` (Next.js middleware entry point, not standard `middleware.ts`)
   - **Do not modify** unless changing auth flow

## Authentication Architecture

### Dual Auth System
Coexisting password-based AND OTP flows with redirect-based token exchange:

**Server Actions** ([app/login/actions.ts](app/login/actions.ts)):
- `login()` - Password auth via `signInWithPassword`
- `signup()` - New user registration via `signUp`
- `sendOtp()` - Send magic link via `signInWithOtp`
- `verifyOtp()` - Verify OTP token via `verifyOtp`
- All redirect on success/error (not return responses)

**Client Helpers** ([app/login/clientAuth.ts](app/login/clientAuth.ts)):
- Mirrored functions for client component auth interactions
- Pattern: `sendOtpClient(email)`, `verifyOtpClient(email, token)`
- Returns `{ error }` object (doesn't redirect)
- Used when interactive feedback needed before redirect

**Auth Callback** ([app/auth/confirm/route.ts](app/auth/confirm/route.ts)):
- Handles GET requests from Supabase email links
- Exchanges `code` (signup) or `token_hash` (OTP) for sessions
- Redirects to `/register` (signup path param) or `/dashboard` (default)

**Environment-safe Redirect Pattern**:
```ts
const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`
```

## Database Schema & RLS

All tables in [db/migrations/](db/migrations/) use 3-phase setup (0001 users + triggers, 0002 RLS enable, 0003 app tables):

**Standard Table Structure** (from 0003):
```sql
CREATE TABLE IF NOT EXISTS public.table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Required for Every Table**:
1. Enable RLS: `ALTER TABLE public.table ENABLE ROW LEVEL SECURITY;`
2. User-scoped policies (4): SELECT, INSERT, UPDATE, DELETE all `USING (auth.uid() = user_id)`
3. Auto-update trigger: `BEFORE UPDATE` executes `set_updated_at()` function
4. User index: `CREATE INDEX table_user_idx ON public.table (user_id)`

**Core Tables**: `users` (auth), `goal`, `journal`, `moods`, `physical_health`, `positive_reinforcement_message`, `relaxation_suggestions`, `visualization`, `articles` (public read)

## Server Actions Pattern

**Every server action follows this structure** ([app/goals/actions.ts](app/goals/actions.ts) is canonical):

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createGoal(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Auth check ALWAYS first
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')
  
  // 2. Input validation
  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Goal name required' }
  
  // 3. Database operation with user_id
  const { error } = await supabase.from('goal').insert({
    user_id: user.id,
    name: name.trim(),
    progress: 'Not Started'
  })
  if (error) return { error: error.message }
  
  // 4. Cache revalidation then redirect (if needed)
  revalidatePath('/goals', 'layout')
  return { success: true }  // or redirect('/goals') for forms
}
```

**Key Rules**:
- Return `{ error: string }` for client-side handling
- Use `redirect()` in error cases OR after successful mutations
- **NEVER return user data** - rely on middleware to set cookies
- Always pass `user.id` to `user_id` fields (RLS enforces this)
- Call `revalidatePath()` after mutations to bust cache

## Client Component Patterns

**Interactive pages** use client-side state + server actions (see [app/mood/page.tsx](app/mood/page.tsx)):

```tsx
"use client"
import { useState } from "react"
import { saveMood } from "./actions"

export default function Page() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('mood_rating', selectedMood.toString())
    
    const result = await saveMood(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSelectedMood(null)
      // Optional: router.push('/dashboard') or show success
    }
    setLoading(false)
  }
  
  return (
    <>
      <Navbar />
      {/* UI with loading/error states */}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </>
  )
}
```

**Key Patterns**:
- Use `'use client'` directive at top for interactive components
- Dynamic backgrounds with mood ratings (see `app/mood/page.tsx` for `backgroundColor` state)
- Always include `<Navbar />` in main layouts
- Handle errors locally, let server actions handle redirects

## Environment Setup

**Required in `.env.local`**:
```env
# Server-side (no NEXT_PUBLIC_ prefix)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Client-side (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...  # Use anon key if publishable not available
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Required for auth redirects
```

**Critical**: Both sets must have same URL/key values or auth will fail.

## Styling Conventions

**Brand Colors**:
- Primary: `#A4B870` (green)
- Dark: `#6E8450` (dark green)
- Background: `#F5F5F0` (off-white)
- Text: `#93a664` (muted green for labels)

**Common Patterns**:
- Rounded buttons: `rounded-full bg-[#A4B870] px-6 py-3 text-white`
- Form inputs: `rounded-full border border-gray-200 px-4 py-3 shadow-sm`
- Cards: `rounded-3xl bg-white/90 p-10 shadow-xl backdrop-blur-md`
- Dynamic backgrounds: Use `document.body.style.backgroundColor` in `useEffect()` (see mood page)
- Sidebar navigation: Fixed left sidebar, `md:` breakpoint for responsive hide

## Development Commands

```bash
npm run dev        # localhost:3000
npm run build      # Production build (check for errors before deploy)
npm run start      # Run production build locally
npm run lint       # ESLint check (flat config format)
```

## Common Debugging Issues

1. **"Invalid API key"** → Check env vars have correct prefixes
2. **RLS policy errors** → User not authenticated OR policy doesn't match `auth.uid()`
3. **Auth not persisting** → Check `sb-*` cookies in Network tab
4. **Server action not working** → Verify `'use server'` directive at top of file
5. **Client component error** → Check for `'use client'` directive
6. **404 on auth callback** → Verify `NEXT_PUBLIC_APP_URL` environment variable
7. **Mood colors not applying** → Check that `useEffect()` with `document.body.style` runs

## Key File Locations & Purposes

| Path | Purpose |
|------|---------|
| `app/*/page.tsx` | Main page components (client-side interactive) |
| `app/*/actions.ts` | Server actions for data mutations (database + auth) |
| `app/auth/confirm/route.ts` | OAuth/OTP token exchange handler |
| `utils/supabase/*` | Client/server/middleware initialization |
| `db/migrations/` | SQL schema with RLS policies |
| `components/Navbar.tsx` | Navigation sidebar (responsive, appears on all pages) |
| `.github/copilot-instructions.md` | This file - AI agent guidance |

## Adding New Features

**New protected page**:
1. Create `app/[route]/page.tsx` (client component if interactive)
2. Create `app/[route]/actions.ts` for server actions
3. Auth check in server action (see pattern above)
4. Add to navigation if needed in `Navbar.tsx` navItems array

**New database table**:
1. Add migration: `db/migrations/000X_description.sql`
2. Follow RLS pattern (enable RLS + user policy + trigger)
3. Run migration in Supabase dashboard or CLI

## Project Quirks

- **Middleware is `proxy.ts`** not `middleware.ts` (project-specific choice)
- **Login page uses mode state** (`"password" | "otp" | "forgot" | "resend"`) for UI switching
- **Path alias `@/`** maps to project root via `tsconfig.json`
- **Geist fonts** loaded in root layout with CSS variables
- **Navbar is always included** in layouts via `<Navbar />` component
