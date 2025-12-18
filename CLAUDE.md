# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mental health web application built with Next.js 16 (App Router), React 19, Supabase for authentication and database, and Tailwind CSS 4. The app helps users track mood, journal entries, physical health metrics, goals, and access relaxation techniques and mental health articles.

## Development Commands

```bash
# Start development server (default: http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable/anon key

## Architecture Overview

### Authentication Pattern

The app uses Supabase Auth with SSR (Server-Side Rendering) cookie-based sessions:

- **Server Components & Actions**: Use `createClient()` from `utils/supabase/server.ts` which handles cookies via Next.js `cookies()` API
- **Client Components**: Use `createBrowserClient()` from `utils/supabase/client.ts` (if needed, though most client components use server actions)
- **Middleware**: Session refresh handled via `utils/supabase/middleware.ts`

Server actions in `app/*/actions.ts` files handle auth checks and redirect to `/login` if unauthenticated.

### Page Structure

The app follows Next.js App Router conventions:

```
app/
├── layout.tsx              # Root layout (fonts, metadata)
├── page.tsx                # Landing/home page
├── dashboard/
│   ├── page.tsx           # Main dashboard (client component)
│   └── actions.ts         # Server actions for dashboard data
├── mood/
│   ├── page.tsx           # Mood logging interface
│   └── actions.ts         # Mood CRUD operations
├── journal/
│   ├── page.tsx           # Journal editor
│   └── actions.ts         # Journal CRUD operations
├── physical-health/
│   ├── page.tsx           # Physical health tracking
│   └── actions.ts         # Health data operations
├── goals/
│   ├── page.tsx           # Goal management
│   └── actions.ts         # Goal CRUD operations
├── relaxation/
│   ├── page.tsx           # Relaxation suggestions
│   └── actions.ts         # Activity filtering logic
├── visualization/
│   ├── page.tsx           # Data visualizations
│   └── actions.ts         # Chart data aggregation
├── articles/
│   ├── page.tsx           # Article list
│   ├── [id]/page.tsx      # Individual article view
│   └── actions.ts         # Article fetching
├── settings/
│   ├── page.tsx           # User settings/profile
│   └── actions.ts         # Profile updates, password reset
├── login/
│   ├── page.tsx           # Login page
│   ├── actions.ts         # Login server action
│   └── clientAuth.ts      # Client-side auth helpers
├── register/
│   └── page.tsx           # Registration page
├── reset-password/
│   └── page.tsx           # Password reset page
└── api/                   # API route handlers
    ├── auth/login/route.ts
    ├── mood-today/route.ts
    ├── physical-health-today/route.ts
    └── user-profile/route.ts
```

### Key Architectural Patterns

1. **Server Actions Pattern**: All data mutations and fetches use server actions (functions marked with `'use server'`). These are called from client components and handle authentication, database operations, and redirects server-side.

2. **Dashboard Data Aggregation**: `app/dashboard/actions.ts` contains `getDashboardData()` which aggregates data from multiple Supabase tables (moods, physical_health, articles, journal, goal) in a single server action call to minimize client-server round trips.

3. **Relaxation Activity Filtering**: The app filters relaxation activities based on mood rating. Activities have `minMood` and `maxMood` ranges. The filtering logic is in both `app/relaxation/actions.ts` and duplicated in `app/dashboard/actions.ts` (line 66-135) for dashboard suggestions.

4. **Client State Management**: Pages use React `useState` and `useEffect` for client state. No global state management library is used. Data is fetched via server actions and cached locally in component state.

5. **Physical Health Data Storage**: Physical health metrics (weight, sleep hours, step counts) are stored as JSON in the `complaints` field of the `physical_health` table. The dashboard action parses this JSON to extract individual metrics (lines 241-248 in `app/dashboard/actions.ts`).

6. **Mood-Based Background Colors**: The mood logging page (`app/mood/page.tsx`) dynamically changes the entire page background color based on selected or logged mood using `document.body.style.backgroundColor`.

### Component Structure

- **Navbar**: `components/Navbar.tsx` - Collapsible sidebar navigation that shows on desktop (left side, can expand/collapse) and as a slide-out menu on mobile. Uses `useRouter` and `usePathname` for navigation and active state.

### Database Schema (Inferred)

Key Supabase tables:
- `users` - username, full_name (extends Supabase auth.users)
- `moods` - mood_rating (1-5), mood_at, user_id
- `physical_health` - complaints (JSON with weight, sleepHours, stepCounts), user_id
- `journal` - title, content, date_created, user_id
- `goal` - name, target (date or "Indefinite"), progress ("In Progress", "Completed"), user_id
- `articles` - title, content, date_published

### Important Implementation Details

1. **Path Aliases**: The project uses `@/*` to reference the project root (configured in `tsconfig.json`). Always use `@/` imports for absolute paths.

2. **Today's Goals Logic**: The dashboard shows goals that are either due today (exact date match) or marked as "Indefinite" or contain "daily" (case-insensitive). See `app/dashboard/actions.ts` lines 218-224.

3. **Mood Logging Constraints**: Users can only log one mood per day. The UI shows a "locked" state if mood already logged, with an option to change. This logic is in `app/mood/page.tsx` lines 23-96.

4. **Greeting Randomization**: The dashboard shows a random daily greeting that persists for the day using localStorage (lines 89-120 in `app/dashboard/page.tsx`).

5. **Stress Level Calculation**: Stress level is calculated as `1 - (average mood rating / 5) * 100%` based on the last 7 days of mood data (line 228 in `app/dashboard/actions.ts`).

6. **API Routes vs Server Actions**: The app uses both patterns. Some features use API routes (`/api/*`) called via `fetch()` from client components (e.g., mood-today check), while others use server actions directly. Prefer server actions for new features.

## Testing Considerations

- No test suite currently exists
- When adding tests, consider authentication mocking for server actions
- Test mood filtering logic for relaxation activities
- Test date-based goal filtering for "today's goals"

## Styling

- Tailwind CSS 4 with PostCSS
- Custom color palette: Primary green `#A4B870`, darker green `#6E8450`, coral `#FF8C69`, neutral `#F5F5F0`
- Components use rounded corners (rounded-3xl, rounded-2xl) and soft shadows
- Responsive design with mobile-first approach using md: breakpoints
