# Backend & Team Leadership Guide

**Mental Health Web Application - Comprehensive Backend & Project Management Documentation**

*For Backend Developers, Database Administrators, and Project Leaders*

---

## Table of Contents

1. [Project Architecture Overview](#project-architecture-overview)
2. [Database Schema & Management](#database-schema--management)
3. [Authentication & Security](#authentication--security)
4. [API Architecture & Server Actions](#api-architecture--server-actions)
5. [Environment Configuration](#environment-configuration)
6. [Deployment & DevOps](#deployment--devops)
7. [Team Leadership & Coordination](#team-leadership--coordination)
8. [Development Workflow](#development-workflow)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Common Issues & Solutions](#common-issues--solutions)
11. [Performance Optimization](#performance-optimization)
12. [Security Best Practices](#security-best-practices)

---

## Project Architecture Overview

### Technology Stack (Backend Perspective)

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)            │
│  - React 19 (Client Components)                     │
│  - Server Components & Server Actions               │
│  - Tailwind CSS 4                                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Authentication Layer                    │
│  - Supabase Auth (SSR Cookie-based)                 │
│  - Email/Password + OTP/Magic Link                  │
│  - JWT Tokens in HTTP-only cookies                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                 Backend Services                     │
│  - Supabase (PostgreSQL + Auth + Storage)           │
│  - Server Actions (Next.js 'use server')            │
│  - API Routes (REST endpoints)                      │
│  - Row Level Security (RLS) Policies                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│  - 8 Core Tables + Auth Tables                      │
│  - RLS Policies for User Isolation                  │
│  - Triggers for Auto-updates                        │
│  - Foreign Key Constraints                          │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Server-First Approach**: All data mutations happen via server actions, not client-side API calls
2. **Cookie-Based Auth**: Uses HTTP-only cookies for JWT storage (more secure than localStorage)
3. **Row Level Security**: Database-enforced user data isolation (defense in depth)
4. **Stateless Backend**: No session storage, JWT tokens contain all auth state
5. **Optimistic Data Aggregation**: Dashboard uses single server action to fetch all data (reduces round trips)

### Data Flow Pattern

```
User Action (Click/Submit)
    ↓
Client Component State Update
    ↓
Server Action Call (with FormData)
    ↓
Auth Check (Supabase auth.getUser())
    ↓
Database Operation (with RLS enforcement)
    ↓
revalidatePath() or redirect()
    ↓
Client Re-renders with Fresh Data
```

---

## Database Schema & Management

### Core Tables

#### 1. **users** (Extends auth.users)
```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- **Purpose**: User profile data
- **RLS Policy**: Users can only SELECT/UPDATE their own row
- **Key Fields**:
  - `phone_number` (NOT `phone` - critical for backend queries)
  - `username` is unique and used for display

#### 2. **moods**
```sql
CREATE TABLE public.moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  mood_at timestamptz DEFAULT now(),
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
```
- **Purpose**: Daily mood tracking (1-5 scale)
- **Constraint**: One mood per day enforced in application logic
- **Index**: `moods_user_idx` on user_id for fast queries
- **Business Logic**:
  - Dashboard calculates stress level from 7-day average
  - Relaxation activities filtered by mood_rating

#### 3. **journal**
```sql
CREATE TABLE public.journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) > 0),
  content text,
  date_created date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);
```
- **Purpose**: User journal entries
- **Validation**: Title cannot be empty (CHECK constraint)
- **Storage**: Content stored as plain text (consider JSON for rich text future)

#### 4. **goal**
```sql
CREATE TABLE public.goal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) > 0),
  target text,
  progress text DEFAULT 'Not Started',
  updated_at timestamptz DEFAULT now()
);
```
- **Purpose**: User goal tracking
- **Target Field**: Flexible text field (date, "Indefinite", or "daily")
- **Progress Values**: "Not Started", "In Progress", "Completed"
- **Dashboard Logic**: Shows goals with target = today OR "Indefinite" OR contains "daily"

#### 5. **physical_health**
```sql
CREATE TABLE public.physical_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  complaints text,  -- JSON: { weight, sleepHours, stepCounts }
  health_id text,
  updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Physical health metrics
- **Storage Format**: JSON stored in `complaints` field
  ```json
  {
    "weight": 70.5,
    "sleepHours": 7.5,
    "stepCounts": 8000,
    "date": "2026-01-07T10:00:00Z"
  }
  ```
- **Backend Parsing**: Must parse JSON in server actions (see `app/dashboard/actions.ts` lines 264-271)

#### 6. **articles**
```sql
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  date_published date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- **Purpose**: Mental health articles (public content)
- **RLS Policy**: Public SELECT, admin-only INSERT/UPDATE/DELETE
- **No user_id**: Not user-specific data

#### 7. **relaxation_suggestions**
```sql
CREATE TABLE public.relaxation_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  mood_id uuid REFERENCES moods(id) ON DELETE CASCADE,
  activity_suggestion text,  -- JSON activity object
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
```
- **Purpose**: User-selected relaxation activities
- **Storage**: Full activity object stored as JSON
- **Business Logic**: Users can select 1 to N activities, batch inserted

#### 8. **visualization**
```sql
CREATE TABLE public.visualization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  visualization_id text NOT NULL,
  data integer,
  updated_at timestamptz DEFAULT now()
);
```
- **Purpose**: Visualization preferences/data
- **Note**: Currently underutilized, consider schema redesign

### Database Migrations

**Migration Files** (in `/db/migrations/`):
```
0001_create_users_and_trigger.sql    - Users table + set_updated_at() function
0002_enable_rls_and_policies.sql     - RLS policies for users table
0003_create_app_tables_and_policies.sql - All application tables + RLS
0004_add_created_at_to_physical_health.sql
0005_add_url_to_articles.sql
0006_add_mental_health_articles.sql  - Seed data
0007_add_delete_user_function.sql    - Self-service account deletion
0008_check_email_exists.sql          - Email validation RPC
```

**Migration Best Practices**:
1. **Never modify existing migrations** - always create new ones
2. **Test migrations on staging database first**
3. **Include rollback SQL in comments** if possible
4. **Run migrations in order** - filenames enforce sequence
5. **Backup production database before applying**

### Row Level Security (RLS) Policies

**Standard Policy Pattern** (applied to all user tables):
```sql
-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own rows
CREATE POLICY table_select_own ON public.table_name
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert with their own user_id
CREATE POLICY table_insert_own ON public.table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own rows
CREATE POLICY table_update_own ON public.table_name
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own rows
CREATE POLICY table_delete_own ON public.table_name
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Why RLS is Critical**:
- Defense in depth: Even if application logic fails, database protects data
- Prevents user_id spoofing in malicious requests
- Enforced at PostgreSQL level (cannot be bypassed)
- Required for Supabase best practices

### Database Triggers

**Auto-Update Timestamp Trigger**:
```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applied to every table
CREATE TRIGGER table_set_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Database Indexes

**Performance-Critical Indexes**:
```sql
-- User foreign key indexes (for JOINs and WHERE clauses)
CREATE INDEX moods_user_idx ON moods (user_id);
CREATE INDEX journal_user_idx ON journal (user_id);
CREATE INDEX goal_user_idx ON goal (user_id);
CREATE INDEX physical_health_user_idx ON physical_health (user_id);
CREATE INDEX relaxation_user_idx ON relaxation_suggestions (user_id);

-- Date-based queries
CREATE INDEX articles_date_idx ON articles (date_published DESC);
```

### Stored Procedures (RPC Functions)

#### 1. **delete_user()** - Self-Service Account Deletion
```sql
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```
- **Purpose**: Allow users to delete their own auth account
- **Security**: SECURITY DEFINER allows access to auth.users (normally restricted)
- **Permissions**: Only authenticated users can execute
- **Called from**: `app/settings/actions.ts` deleteAccount()

#### 2. **check_email_exists()** - Email Validation
```sql
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM auth.users WHERE email = email_to_check);
END;
$$;
```
- **Purpose**: Check if email is registered before sending OTP
- **Security**: Prevents OTP spam to non-existent users
- **Called from**: `app/login/clientAuth.ts` sendOtpClient()

---

## Authentication & Security

### Authentication Architecture

#### Dual Authentication System

**1. Password-Based Authentication**
- **Flow**: Email + Password → `signInWithPassword()` → JWT in cookie
- **Implementation**: `app/login/actions.ts` login()
- **Form**: `app/login/page.tsx` (password mode)

**2. OTP/Magic Link Authentication**
- **Flow**: Email → `signInWithOtp()` → Email sent → Click link → Token exchange → JWT
- **Implementation**:
  - `app/login/actions.ts` sendOtp(), verifyOtp()
  - `app/auth/confirm/route.ts` (callback handler)
- **Security**: Email must exist in database (checks via `check_email_exists()`)

#### Token Exchange Flow

```
User clicks email link with token
    ↓
GET /auth/confirm?token_hash=xxx&type=recovery
    ↓
app/auth/confirm/route.ts
    ↓
supabase.auth.exchangeCodeForSession()
    ↓
Sets HTTP-only cookies (sb-access-token, sb-refresh-token)
    ↓
Redirects to /dashboard
```

### Supabase Client Patterns

**CRITICAL: Use correct client for context**

#### 1. Server Components & Actions
```typescript
import { createClient } from '@/utils/supabase/server'

export async function serverAction() {
  const supabase = await createClient()  // MUST await!
  const { data: { user } } = await supabase.auth.getUser()
  // ... database operations
}
```
- **File**: `utils/supabase/server.ts`
- **Cookie Handling**: Uses Next.js `cookies()` API
- **When**: Server actions, Server Components, API routes

#### 2. Client Components
```typescript
import { createClient } from '@/utils/supabase/client'

export function ClientComponent() {
  const supabase = createClient()  // NO await
  // ... client-side auth operations
}
```
- **File**: `utils/supabase/client.ts`
- **When**: Client components with `'use client'` directive
- **Note**: Rarely used - prefer server actions

#### 3. Middleware
```typescript
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```
- **File**: `proxy.ts` (NOT `middleware.ts` - project-specific naming)
- **Purpose**: Refresh auth tokens on every request
- **Do not modify** unless changing auth flow

### Security Best Practices

#### 1. Authentication Checks (MANDATORY)
```typescript
'use server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function protectedAction(formData: FormData) {
  const supabase = await createClient()

  // ALWAYS check auth first
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')  // Redirect unauthenticated users
  }

  // ... rest of action
}
```

#### 2. User ID Enforcement
```typescript
// ALWAYS use authenticated user's ID
const { error } = await supabase
  .from('moods')
  .insert({
    user_id: user.id,  // From auth check above
    mood_rating: rating
  })

// NEVER trust client-provided user_id
// RLS policies will reject mismatched user_id anyway
```

#### 3. Input Validation
```typescript
export async function createGoal(formData: FormData) {
  const name = formData.get('name') as string

  // Validate before database operation
  if (!name || name.trim().length === 0) {
    return { error: 'Goal name is required' }
  }

  // Sanitize input
  const sanitized = name.trim()

  // ... database operation
}
```

#### 4. SQL Injection Prevention
- **Use Supabase client methods** (automatically parameterized)
- **Never concatenate SQL strings** directly
- **Never use raw SQL** from user input

#### 5. XSS Prevention
- React automatically escapes JSX content
- **Never use `dangerouslySetInnerHTML`** without sanitization
- Validate and sanitize all user input

#### 6. CSRF Protection
- Server actions use Next.js built-in CSRF tokens
- Cookies are SameSite=Lax by default
- No additional CSRF middleware needed

### Environment Variables Security

**Required Variables** (`.env.local`):
```env
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Private (server-only) - NONE CURRENTLY
# If adding admin features, use:
# SUPABASE_SERVICE_ROLE_KEY=xxx (NEVER expose to client)
```

**Security Rules**:
- ✅ `NEXT_PUBLIC_*` variables are safe to expose
- ❌ NEVER commit `.env.local` to git
- ❌ NEVER use service role key in client components
- ✅ Use `.env.example` for documentation

---

## API Architecture & Server Actions

### Server Actions Pattern

**Standard Structure** (from `app/goals/actions.ts`):
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createGoal(formData: FormData) {
  const supabase = await createClient()

  // 1. AUTH CHECK (mandatory)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 2. INPUT VALIDATION
  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Goal name required' }

  // 3. DATABASE OPERATION
  const { error } = await supabase
    .from('goal')
    .insert({
      user_id: user.id,
      name: name.trim(),
      progress: 'Not Started'
    })

  if (error) return { error: error.message }

  // 4. CACHE REVALIDATION
  revalidatePath('/goals', 'layout')

  // 5. RETURN OR REDIRECT
  return { success: true }
}
```

### API Routes (Legacy Pattern)

**When to Use API Routes**:
- External webhooks (Stripe, SendGrid, etc.)
- Non-standard HTTP methods (PATCH, etc.)
- Third-party integrations
- **Prefer server actions for everything else**

**Example** (`app/api/auth/login/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  // Create Supabase client with cookie handling
  const response = NextResponse.redirect('/dashboard')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return NextResponse.redirect('/error')

  return response
}
```

### Data Aggregation Pattern

**Dashboard Optimization** (Single Server Action Call):
```typescript
// app/dashboard/actions.ts
export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Parallel queries for performance
  const [
    { data: moods },
    { data: journals },
    { data: goals },
    { data: articles },
    { data: physicalHealth }
  ] = await Promise.all([
    supabase.from('moods').select('*').eq('user_id', user.id),
    supabase.from('journal').select('*').eq('user_id', user.id),
    supabase.from('goal').select('*').eq('user_id', user.id),
    supabase.from('articles').select('*').limit(3),
    supabase.from('physical_health').select('*').eq('user_id', user.id)
  ])

  // Calculate derived data
  const stressLevel = calculateStress(moods)
  const todayGoals = filterTodayGoals(goals)

  return {
    user,
    moods,
    journals,
    goals: todayGoals,
    articles,
    physicalHealth,
    stressLevel
  }
}
```

**Benefits**:
- Single HTTP round trip
- Parallel database queries
- Reduces client-server latency
- Type-safe return object

### Error Handling Pattern

```typescript
export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('users')
      .update({ full_name: formData.get('full_name') })
      .eq('id', user.id)

    if (error) {
      console.error('Database error:', error)
      return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }

  } catch (err) {
    console.error('Unexpected error:', err)
    return { error: 'An unexpected error occurred' }
  }
}
```

---

## Environment Configuration

### Development Environment

**Local Setup**:
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Run migrations in Supabase dashboard (SQL Editor)
5. Start dev server: `npm run dev`

### Staging Environment

**Staging Configuration**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...staging...
NEXT_PUBLIC_APP_URL=https://staging.yourapp.com
```

**Deployment**:
- Use separate Supabase project for staging
- Copy production schema to staging database
- Use anonymized production data for testing
- Test all migrations on staging first

### Production Environment

**Production Configuration**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...prod...
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

**Security Checklist**:
- [ ] Environment variables set in deployment platform
- [ ] `.env.local` NOT committed to git
- [ ] Service role key (if any) stored securely
- [ ] Database backups enabled (automatic in Supabase)
- [ ] RLS policies tested and enabled
- [ ] Rate limiting enabled on Supabase project
- [ ] Email templates configured in Supabase Auth
- [ ] Custom domain configured (if applicable)

---

## Deployment & DevOps

### Docker Deployment

**Docker Setup** (from commits):
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
        - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

**Production Dockerfile**:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Deployment Commands**:
```bash
# Build production image
docker build -t mental-health-app .

# Run production container
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

### CI/CD Pipeline (Recommended)

**GitHub Actions Example**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and push Docker image
        run: |
          docker build -t myapp:latest \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${{ secrets.SUPABASE_KEY }} \
            --build-arg NEXT_PUBLIC_APP_URL=${{ secrets.APP_URL }} \
            .

      - name: Deploy to server
        run: |
          # Deploy via SSH, Docker registry, or cloud provider
```

### Database Backup Strategy

**Supabase Automatic Backups**:
- Daily backups (retained for 7 days on free tier)
- Point-in-time recovery (paid plans)
- Download backups via Supabase dashboard

**Manual Backup** (for critical changes):
```bash
# Export schema
pg_dump -h db.xxx.supabase.co -U postgres \
  --schema-only > schema_backup.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres \
  --data-only > data_backup.sql
```

### Monitoring & Logging

**Application Monitoring**:
- Next.js built-in error tracking
- Console logs in production (structured logging recommended)
- Consider: Sentry, LogRocket, or Datadog for production

**Database Monitoring**:
- Supabase dashboard: Query performance, connection pooling
- Set up alerts for high error rates
- Monitor RLS policy performance

**Health Checks**:
```typescript
// app/api/health/route.ts
export async function GET() {
  const supabase = await createClient()

  try {
    // Check database connection
    const { error } = await supabase.from('users').select('id').limit(1)

    if (error) throw error

    return Response.json({ status: 'healthy' })
  } catch (err) {
    return Response.json({ status: 'unhealthy' }, { status: 500 })
  }
}
```

---

## Team Leadership & Coordination

### Project Leadership Responsibilities

#### 1. Architecture Decisions

**Key Decisions Made** (from commit history):
- ✅ Chose Supabase over custom backend (faster development)
- ✅ Server actions over REST API (better DX, type safety)
- ✅ Cookie-based auth over token-based (security)
- ✅ RLS policies for data isolation (defense in depth)
- ✅ Docker deployment strategy (portability)
- ✅ Monorepo approach (simplified for small team)

**Future Architecture Decisions Needed**:
- [ ] Caching strategy (Redis? ISR?)
- [ ] Real-time features (Supabase Realtime?)
- [ ] File uploads (Supabase Storage?)
- [ ] Email service (SendGrid? Resend?)
- [ ] Analytics (Vercel Analytics? Google Analytics?)

#### 2. Team Coordination

**Communication Channels**:
- Daily standups (recommended for active development)
- GitHub Issues for feature tracking
- Pull Request reviews (mandatory for main branch)
- Documentation updates with each feature

**Code Review Checklist**:
- [ ] Auth check present in all server actions
- [ ] RLS policies tested for new tables
- [ ] Error handling implemented
- [ ] Input validation complete
- [ ] TypeScript types defined
- [ ] Console logs removed (or structured)
- [ ] Documentation updated
- [ ] Migration tested on staging

#### 3. Sprint Planning

**Feature Prioritization** (based on current state):
- **High Priority**: Bug fixes, security patches, performance issues
- **Medium Priority**: New features requested by users
- **Low Priority**: UI improvements, refactoring

**Velocity Tracking** (from commits):
- Average: 2-3 features per week
- Major features: 3-5 days (e.g., relaxation page overhaul)
- Bug fixes: Same day to 1 day
- Database migrations: Plan 1 day for testing

### Git Workflow

**Branching Strategy**:
```
main (production-ready)
  ├── develop (integration branch)
  │   ├── feature/user-settings
  │   ├── feature/mood-tracking
  │   └── bugfix/login-redirect
  └── hotfix/security-patch
```

**Commit Message Format** (improve from current):
```
type(scope): subject

body (optional)

BREAKING CHANGE: description (if applicable)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example**:
```
feat(relaxation): add multi-select activity saving

- Users can select 1 to N activities
- Batch insert to database
- Visual selection indicator with checkmark
- Success/error toast notifications

Closes #45
```

### Code Quality Standards

**Linting**:
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**TypeScript Strict Mode**:
- Enable strict mode in `tsconfig.json`
- No `any` types (use `unknown` if necessary)
- All server actions must have return types

**Code Formatting**:
```bash
# Recommended: Add Prettier
npm install --save-dev prettier
npx prettier --write .
```

---

## Development Workflow

### Local Development Setup

**Step-by-Step**:
1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd MentalHealthWebApp-Frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Setup Database**
   - Go to Supabase dashboard
   - Run migrations in SQL Editor (in order)
   - Verify tables created with RLS enabled

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Browser**
   - Navigate to http://localhost:3000
   - Create test account via `/register`

### Adding New Features

**Example: Adding a New Table**

1. **Create Migration File**
   ```sql
   -- db/migrations/0009_create_notifications.sql
   CREATE TABLE public.notifications (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES users(id) ON DELETE CASCADE,
     message text NOT NULL,
     read boolean DEFAULT false,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz
   );

   CREATE INDEX notifications_user_idx ON public.notifications (user_id);

   ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

   CREATE POLICY notifications_select_own ON public.notifications
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY notifications_insert_own ON public.notifications
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY notifications_update_own ON public.notifications
     FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY notifications_delete_own ON public.notifications
     FOR DELETE USING (auth.uid() = user_id);

   CREATE TRIGGER notifications_set_updated_at
     BEFORE UPDATE ON public.notifications
     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
   ```

2. **Run Migration**
   - Copy SQL to Supabase SQL Editor
   - Execute
   - Verify in Table Editor

3. **Create Server Actions**
   ```typescript
   // app/notifications/actions.ts
   'use server'

   export async function getNotifications() {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) redirect('/login')

     const { data, error } = await supabase
       .from('notifications')
       .select('*')
       .eq('user_id', user.id)
       .order('created_at', { ascending: false })

     if (error) return { error: error.message, data: [] }
     return { data, error: null }
   }
   ```

4. **Create Page**
   ```typescript
   // app/notifications/page.tsx
   'use client'
   import { useEffect, useState } from 'react'
   import { getNotifications } from './actions'

   export default function NotificationsPage() {
     const [notifications, setNotifications] = useState([])

     useEffect(() => {
       async function load() {
         const { data } = await getNotifications()
         setNotifications(data)
       }
       load()
     }, [])

     return (
       <div>
         <h1>Notifications</h1>
         {/* Render notifications */}
       </div>
     )
   }
   ```

5. **Update Navigation**
   ```typescript
   // components/Navbar.tsx
   const navItems = [
     // ... existing items
     { name: 'Notifications', href: '/notifications', icon: Bell }
   ]
   ```

6. **Test Feature**
   - Create test notification via SQL
   - Verify page loads
   - Test RLS policies (try accessing another user's notifications)

### Database Schema Changes

**Safe Schema Changes**:
- ✅ Adding new columns (with DEFAULT or NULL)
- ✅ Adding new tables
- ✅ Adding indexes
- ✅ Creating new RLS policies

**Dangerous Schema Changes** (require downtime):
- ⚠️ Dropping columns (data loss)
- ⚠️ Renaming columns (breaks existing code)
- ⚠️ Changing column types (data corruption risk)
- ⚠️ Dropping tables (data loss)

**Safe Column Rename Pattern**:
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN new_name text;

-- Step 2: Copy data
UPDATE users SET new_name = old_name;

-- Step 3: Update application code (deploy)

-- Step 4: Drop old column (after verifying)
ALTER TABLE users DROP COLUMN old_name;
```

---

## Testing & Quality Assurance

### Current Testing Status

**As of January 2026**:
- ❌ No automated tests
- ✅ Manual testing for each feature
- ⚠️ RLS policies tested manually

### Recommended Testing Strategy

#### 1. Unit Tests (Jest + React Testing Library)

**Setup**:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Example Test**:
```typescript
// __tests__/actions/mood.test.ts
import { saveMood } from '@/app/mood/actions'

describe('saveMood', () => {
  it('validates mood rating range', async () => {
    const formData = new FormData()
    formData.append('mood_rating', '6')  // Invalid

    const result = await saveMood(formData)
    expect(result.error).toBeTruthy()
  })
})
```

#### 2. Integration Tests

**Database Tests** (with test database):
```typescript
// Test RLS policies
test('users cannot access other users moods', async () => {
  const supabase = createTestClient(user1Token)

  const { data } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user2Id)

  expect(data).toHaveLength(0)  // RLS blocks access
})
```

#### 3. End-to-End Tests (Playwright)

**Critical User Flows**:
```typescript
// e2e/auth.spec.ts
test('user can register and login', async ({ page }) => {
  await page.goto('/register')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'Test123!')
  await page.click('button:has-text("Register")')

  await expect(page).toHaveURL('/dashboard')
})
```

### Manual Testing Checklist

**For Each Feature**:
- [ ] Unauthenticated user redirected to login
- [ ] Authenticated user can access feature
- [ ] Data saves correctly to database
- [ ] Error states display properly
- [ ] Loading states work
- [ ] Mobile responsive
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] RLS policies prevent unauthorized access

---

## Common Issues & Solutions

### Authentication Issues

**Issue: "Invalid API key"**
```
Solution:
1. Check .env.local has correct NEXT_PUBLIC_SUPABASE_URL
2. Verify NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (NOT service role key)
3. Restart dev server after env var changes
```

**Issue: Auth not persisting after login**
```
Solution:
1. Check cookies in browser DevTools (should see sb-* cookies)
2. Verify NEXT_PUBLIC_APP_URL matches current domain
3. Check proxy.ts middleware is running
4. Clear browser cookies and try again
```

**Issue: OTP emails not sending**
```
Solution:
1. Check Supabase dashboard → Authentication → Email Templates
2. Verify email provider configured (default: Supabase email)
3. Check spam folder
4. Verify email confirmation enabled in Supabase settings
```

### Database Issues

**Issue: RLS policy blocks legitimate query**
```sql
-- Debug: Check current user
SELECT auth.uid();

-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'moods';

-- Test policy manually
SELECT * FROM moods WHERE user_id = auth.uid();
```

**Issue: Migration fails with constraint violation**
```
Solution:
1. Check existing data violates new constraint
2. Either fix data first or adjust constraint
3. Use IF NOT EXISTS for idempotent migrations
```

**Issue: Slow queries**
```
Solution:
1. Check EXPLAIN ANALYZE in Supabase SQL Editor
2. Add missing indexes on foreign keys
3. Optimize WHERE clauses
4. Consider materialized views for complex queries
```

### Performance Issues

**Issue: Dashboard loads slowly**
```
Solution (already implemented):
1. Use Promise.all() for parallel queries
2. Limit data fetching (e.g., last 30 days)
3. Add indexes on frequently queried columns
4. Consider ISR (Incremental Static Regeneration)
```

**Issue: Large JSON fields slow down queries**
```
Solution:
1. Normalize JSON data into separate tables
2. Use PostgreSQL JSON operators for selective querying
3. Add GIN index on JSONB columns if needed
```

---

## Performance Optimization

### Current Optimizations

1. **Parallel Database Queries** (Dashboard)
   ```typescript
   const [moods, journals, goals] = await Promise.all([
     supabase.from('moods').select('*'),
     supabase.from('journal').select('*'),
     supabase.from('goal').select('*')
   ])
   ```

2. **Database Indexes** (All foreign keys indexed)

3. **Selective Data Fetching** (Limit queries to relevant date ranges)

### Future Optimizations

**1. Implement Caching**
```typescript
// Use Next.js cache
import { unstable_cache } from 'next/cache'

export const getArticles = unstable_cache(
  async () => {
    const supabase = await createClient()
    return await supabase.from('articles').select('*')
  },
  ['articles'],
  { revalidate: 3600 }  // 1 hour
)
```

**2. Add Connection Pooling** (Already handled by Supabase)

**3. Optimize Images**
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={activity.image}
  width={800}
  height={600}
  alt={activity.title}
  loading="lazy"
/>
```

**4. Code Splitting**
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <p>Loading chart...</p>
})
```

---

## Security Best Practices

### OWASP Top 10 Compliance

1. **Injection** - ✅ Prevented via Supabase parameterized queries
2. **Broken Authentication** - ✅ Supabase Auth + HTTP-only cookies
3. **Sensitive Data Exposure** - ✅ RLS policies + HTTPS
4. **XML External Entities** - N/A (no XML parsing)
5. **Broken Access Control** - ✅ RLS policies enforce user isolation
6. **Security Misconfiguration** - ⚠️ Review regularly
7. **XSS** - ✅ React auto-escaping
8. **Insecure Deserialization** - ⚠️ Validate JSON from physical_health.complaints
9. **Using Components with Known Vulnerabilities** - ⚠️ Run `npm audit`
10. **Insufficient Logging** - ⚠️ Add structured logging

### Security Audit Checklist

**Monthly Tasks**:
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review Supabase auth logs for suspicious activity
- [ ] Check for unused API keys
- [ ] Verify RLS policies still active
- [ ] Review user-reported security issues

**Quarterly Tasks**:
- [ ] Penetration testing (manual or automated)
- [ ] Review and rotate credentials
- [ ] Update dependencies to latest stable versions
- [ ] Security code review of new features

---

## Appendix: Commit History Analysis

### Key Milestones (from moreno_commits.txt)

**December 18, 2025 - Major Architecture Update**
- Implemented RLS policies (0002 migration)
- Added self-service account deletion RPC
- Added email validation RPC
- Docker deployment setup
- Fixed authentication flow

**December 19, 2025 - UI/UX Improvements**
- Fixed journal page mobile responsiveness
- Fixed scroll overflow across all pages
- Improved error handling

**January 7, 2026 - Recent Enhancements**
- Updated profile settings (phone_number fix)
- Added comprehensive feature documentation
- Implemented multi-select relaxation activities
- Added form validation with error states

### Development Patterns Observed

1. **Iterative Fixes**: Many "Fix Stuff" commits → Need better commit messages
2. **Feature-First**: Features added quickly, tests added later (or not at all)
3. **Database-First**: Schema changes drive feature development
4. **Responsive to Issues**: Quick bug fixes (same-day deployment)

### Recommendations for Future Development

1. **Improve Commit Messages**: Use conventional commits format
2. **Add Tests**: Implement testing before production deployment
3. **Documentation**: Update docs with each feature
4. **Code Reviews**: Require PR approval before merging to main
5. **Staging Environment**: Test migrations on staging before production

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Run ESLint

# Docker
docker-compose up -d     # Start dev containers
docker-compose down      # Stop containers
docker-compose logs -f   # View logs

# Database
# Run in Supabase SQL Editor:
SELECT * FROM pg_policies;  # View all RLS policies
SELECT auth.uid();          # Get current user ID
```

### Critical Files Reference

| File | Purpose |
|------|---------|
| `proxy.ts` | Authentication middleware (NOT middleware.ts) |
| `utils/supabase/server.ts` | Server-side Supabase client |
| `utils/supabase/client.ts` | Client-side Supabase client |
| `app/*/actions.ts` | Server actions for each feature |
| `db/migrations/*.sql` | Database schema and RLS policies |
| `.env.local` | Environment variables (NOT committed) |
| `CLAUDE.md` | Frontend architecture guide |
| `FEATURE_FUNCTIONS.md` | Complete API reference |

### Support Contacts

- **Database Issues**: Supabase Support (support.supabase.com)
- **Next.js Issues**: Next.js Discord or GitHub Discussions
- **Deployment Issues**: Check Docker logs first

---

*Last Updated: January 7, 2026*

*Maintained by: Project Lead & Backend Team*
