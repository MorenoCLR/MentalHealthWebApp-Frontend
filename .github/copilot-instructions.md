# Mental Health Web App - AI Agent Instructions

## Project Overview
Next.js 16 (App Router) + Supabase mental health web app with cookie-based auth, TypeScript, Tailwind CSS 4, and `@supabase/ssr` for server-side rendering.

## Critical: Three Supabase Client Patterns

**You MUST use the correct client for each context** - mixing these causes auth failures:

1. **Server Components/Actions** → `@/utils/supabase/server`
   ```ts
   import { createClient } from '@/utils/supabase/server'
   const supabase = await createClient()  // Always await!
   ```
   - Environment vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (no `NEXT_PUBLIC_` prefix)
   - Used in: Server actions (`actions.ts`), Server Components, API routes

2. **Client Components** → `@/utils/supabase/client`
   ```ts
   import { createClient } from '@/utils/supabase/client'
   const supabase = createClient()  // No await
   ```
   - Environment vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Used in: Client components with `'use client'` directive

3. **Middleware** → `@/utils/supabase/middleware`
   - Special cookie handling for auth token refresh
   - Called from `proxy.ts` (Next.js middleware entry point)
   - **Do not modify** unless changing auth flow

## Authentication Architecture

### Dual Auth System
Coexisting password-based AND OTP flows:

**Server Actions** ([app/login/actions.ts](app/login/actions.ts)):
- `login(formData)` - Password auth
- `signup(formData)` - New user registration
- `sendOtp(formData)` - Send magic link
- `verifyOtp(formData)` - Verify OTP token

**Client Helpers** ([app/login/clientAuth.ts](app/login/clientAuth.ts)):
- Mirror server actions for client component use
- Pattern: `sendOtpClient(email)`, `verifyOtpClient(email, token)`
- Used in interactive UI where Server Actions aren't suitable

**API Route** ([app/api/auth/login/route.ts](app/api/auth/login/route.ts)):
- Handles form POST from login page
- Returns proper redirects or error responses

**Auth Callback** ([app/auth/confirm/route.ts](app/auth/confirm/route.ts)):
- Processes email confirmation redirects from Supabase
- Exchanges tokens for session cookies

**Redirect Pattern** (critical for auth flows):
```ts
const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`
```

## Database Schema & RLS

All tables in `db/migrations/` follow these patterns:

**Standard Table Structure**:
```sql
CREATE TABLE table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Required for Every Table**:
1. Enable RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. User-scoped policy: `CREATE POLICY ... USING (user_id = auth.uid())`
3. Updated trigger: `CREATE TRIGGER ... EXECUTE FUNCTION set_updated_at()`

**Core Tables**: `users`, `goal`, `journal`, `moods`, `physical_health`, `positive_reinforcement_message`, `relaxation_suggestions`, `articles`

## Server Actions Pattern

**Every server action follows this structure** (see [app/goals/actions.ts](app/goals/actions.ts)):

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function actionName(formData: FormData) {
  const supabase = await createClient()
  
  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')
  
  // Validate input
  const field = formData.get('field') as string
  if (!field) return { error: 'Field required' }
  
  // Database operation
  const { error } = await supabase.from('table').insert({ user_id: user.id, field })
  if (error) return { error: error.message }
  
  // Revalidate and redirect
  revalidatePath('/route', 'layout')  // Updates cached data
  return { success: true }
}
```

**Key Rules**:
- Always check auth before database operations
- Return `{ error: string }` for validation failures
- Call `revalidatePath()` after data changes
- Use `redirect()` for navigation (not `router.push()`)

## Client Component Patterns

**Interactive pages** use client-side state with server actions:

```tsx
"use client"
import { useState } from "react"
import { actionName } from "./actions"

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('field', value)
    
    const result = await actionName(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }
  
  return (/* JSX with loading/error states */)
}
```

See [app/mood/page.tsx](app/mood/page.tsx) for full example with dynamic backgrounds.

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

## Adding New Features

**New protected page**:
1. Create `app/[route]/page.tsx` (client component if interactive)
2. Create `app/[route]/actions.ts` for server actions
3. Auth check in server action (see pattern above)
4. Add to navigation if needed

**New database table**:
1. Add migration: `db/migrations/000X_description.sql`
2. Follow RLS pattern (enable RLS + user policy + trigger)
3. Run migration in Supabase dashboard or CLI

## Project Quirks

- **Middleware is `proxy.ts`** not `middleware.ts` (project-specific choice)
- **Login page uses mode state** (`"password" | "otp" | "forgot" | "resend"`) for UI switching
- **Path alias `@/`** maps to project root via `tsconfig.json`
- **Geist fonts** loaded in root layout with CSS variables
