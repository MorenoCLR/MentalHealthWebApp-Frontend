# Feature Functions Documentation

This document provides a comprehensive overview of all feature functions used in the Mental Health Web Application.

---

## Table of Contents

1. [Authentication & Login](#authentication--login)
2. [Dashboard](#dashboard)
3. [Mood Tracking](#mood-tracking)
4. [Journal](#journal)
5. [Physical Health](#physical-health)
6. [Goals](#goals)
7. [Relaxation](#relaxation)
8. [Visualization](#visualization)
9. [Articles](#articles)
10. [Settings](#settings)

---

## Authentication & Login

**Location**: `app/login/actions.ts`, `app/login/clientAuth.ts`, `app/api/auth/login/route.ts`

### Server Actions

#### `login(formData: FormData)`
- **Purpose**: Authenticates user with email and password
- **Parameters**: FormData containing `email` and `password`
- **Returns**: Redirects to `/dashboard` on success, `/error` on failure
- **Revalidates**: `/` layout

#### `signup(formData: FormData)`
- **Purpose**: Creates new user account (basic version)
- **Parameters**: FormData containing `email` and `password`
- **Returns**: Redirects to `/dashboard` on success, `/error` on failure
- **Revalidates**: `/` layout

#### `sendOtp(formData: FormData)`
- **Purpose**: Sends OTP to user's email for passwordless login
- **Checks**: Email must exist in database (calls `check_email_exists` RPC)
- **Parameters**: FormData containing `email`
- **Returns**: Redirects to `/login?mode=otp_verify` on success
- **Error Handling**: Redirects with error query params if email not found

#### `verifyOtp(formData: FormData)`
- **Purpose**: Verifies OTP code entered by user
- **Parameters**: FormData containing `email`, `token`, and `type` (default: 'recovery')
- **Returns**: Redirects to `/dashboard` on success
- **Revalidates**: `/` layout

#### `resetPassword(formData: FormData)`
- **Purpose**: Sends password reset email
- **Parameters**: FormData containing `email`
- **Returns**: Redirects to `/login` on success, `/error` on failure

#### `resendConfirmationEmail(formData: FormData)`
- **Purpose**: Resends email confirmation for new signups
- **Parameters**: FormData containing `email`
- **Returns**: Redirects to `/login?mode=waiting_for_confirmation`

### Client Functions

**Location**: `app/login/clientAuth.ts`

#### `sendOtpClient(email: string)`
- **Purpose**: Client-side OTP sending with email validation
- **Checks**: Verifies email exists before sending OTP
- **Returns**: `{ error }` object
- **Prevents**: User creation for non-existent emails

#### `verifyOtpClient(email: string, token: string, type: string = 'recovery')`
- **Purpose**: Client-side OTP verification
- **Returns**: `{ error }` object

#### `resetPasswordClient(email: string)`
- **Purpose**: Client-side password reset with email validation
- **Checks**: Verifies email exists before sending reset
- **Returns**: `{ error }` object

#### `resendConfirmationClient(email: string)`
- **Purpose**: Client-side confirmation email resend
- **Returns**: `{ error }` object

---

## Dashboard

**Location**: `app/dashboard/actions.ts`

### Server Actions

#### `getDashboardData(): Promise<DashboardData>`
- **Purpose**: Aggregates all dashboard data in a single server call
- **Authentication**: Requires authenticated user
- **Returns**: Object containing:
  - `user`: User profile (id, email, username, full_name)
  - `latestMood`: Most recent mood entry
  - `weeklyMoods`: Last 7 days of mood data
  - `physicalHealth`: Latest physical health entry with parsed JSON metrics
  - `articles`: Top 3 recent articles
  - `suggestions`: 3 random relaxation suggestions based on today's mood
  - `journals`: Top 3 recent journal entries
  - `goals`: Today's goals (due today or indefinite)
  - `stressLevel`: Calculated stress percentage (0-100)
  - `goalsCount`: Total number of goals
  - `hasLoggedMoodToday`: Boolean flag

**Algorithm Details**:
- **Stress Level Calculation**: `(1 - (average mood rating / 5)) * 100`
- **Today's Goals Filter**: Includes goals with target = today's date, "Indefinite", or containing "daily"
- **Mood-Based Suggestions**: Filters `RELAXATION_ACTIVITIES` where user's mood falls within activity's `[minMood, maxMood]` range
- **Physical Health Parsing**: Extracts `weight`, `sleepHours`, `stepCounts` from JSON stored in `complaints` field

---

## Mood Tracking

**Location**: `app/mood/actions.ts`

### Server Actions

#### `saveMood(formData: FormData)`
- **Purpose**: Saves or updates user's mood for the current day
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `mood_rating` (1-5)
- **Validation**: Mood rating must be between 1-5
- **Behavior**:
  - Checks for existing mood entry for today
  - Updates existing entry if found
  - Creates new entry if none exists for today
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/mood` and `/dashboard` layouts

#### `getMoodHistory()`
- **Purpose**: Retrieves last 30 mood entries for the user
- **Authentication**: Requires authenticated user
- **Returns**: `{ data: MoodEntry[], error: null }` or `{ error: string, data: [] }`
- **Ordering**: Most recent first (descending by `mood_at`)

---

## Journal

**Location**: `app/journal/actions.ts`

### Server Actions

#### `getJournals()`
- **Purpose**: Retrieves all journal entries for the user
- **Authentication**: Requires authenticated user
- **Returns**: `{ data: JournalEntry[], error: null }` or `{ error: string, data: [] }`
- **Ordering**: Most recent first (descending by `date_created`)

#### `getJournal(id: string)`
- **Purpose**: Retrieves a single journal entry by ID
- **Authentication**: Requires authenticated user
- **Validation**: Ensures entry belongs to current user
- **Returns**: `{ data: JournalEntry, error: null }` or `{ error: string, data: null }`

#### `createJournal(formData: FormData)`
- **Purpose**: Creates new journal entry
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `title` and `content`
- **Validation**: Title is required and cannot be empty
- **Behavior**: Sets `date_created` to current date (YYYY-MM-DD format)
- **Returns**: `{ success: true, data: JournalEntry }` or `{ error: string }`
- **Revalidates**: `/journal` layout

#### `updateJournal(formData: FormData)`
- **Purpose**: Updates existing journal entry
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `id`, `title`, and `content`
- **Validation**:
  - ID is required
  - Title is required and cannot be empty
  - Entry must belong to current user
- **Behavior**: Sets `updated_at` to current timestamp
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/journal` layout

#### `deleteJournal(id: string)`
- **Purpose**: Deletes a journal entry
- **Authentication**: Requires authenticated user
- **Validation**: Ensures entry belongs to current user
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/journal` layout

**Type Definitions**:
```typescript
type JournalEntry = {
  id: string
  user_id: string
  title: string
  content: string | null
  date_created: string
  updated_at: string
}
```

---

## Physical Health

**Location**: `app/physical-health/actions.ts`

### Server Actions

#### `savePhysicalHealth(formData: FormData)`
- **Purpose**: Saves or updates physical health data for the current day
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `weight`, `sleep_hours`, `step_counts`
- **Validation**: At least one field must be filled
- **Data Storage**: Metrics stored as JSON in `complaints` field:
  ```json
  {
    "weight": number | null,
    "sleepHours": number | null,
    "stepCounts": number | null,
    "date": ISO timestamp
  }
  ```
- **Behavior**:
  - Checks for existing entry for today
  - Updates if exists, inserts new entry otherwise
  - Generates `health_id` as `health_{timestamp}` for new entries
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/physical-health` and `/dashboard` layouts

#### `getLast7DaysPhysicalHealth()`
- **Purpose**: Retrieves physical health entries from last 7 days
- **Authentication**: Requires authenticated user
- **Returns**: `{ data: PhysicalHealthEntry[], error: null }` or `{ error: string, data: [] }`
- **Ordering**: Most recent first (descending by `created_at`)

**Type Definitions**:
```typescript
type PhysicalHealthData = {
  weight?: number
  sleepHours?: number
  stepCounts?: number
}
```

---

## Goals

**Location**: `app/goals/actions.ts`

### Server Actions

#### `createGoal(formData: FormData)`
- **Purpose**: Creates a new goal
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `name` and `target`
- **Validation**:
  - Name is required and cannot be empty
  - Target (frequency) is required and cannot be empty
- **Behavior**: Sets initial progress to "Not Started"
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/goals` layout

#### `updateGoal(formData: FormData)`
- **Purpose**: Updates existing goal
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `id`, `name`, `target`, and optional `progress`
- **Validation**:
  - Goal ID is required
  - Name is required and cannot be empty
  - Target is required and cannot be empty
  - Goal must belong to current user
- **Behavior**:
  - Updates `updated_at` timestamp
  - Optionally updates progress status
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/goals` layout

#### `deleteGoal(goalId: string)`
- **Purpose**: Deletes a goal
- **Authentication**: Requires authenticated user
- **Validation**: Ensures goal belongs to current user
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/goals` layout

#### `getGoals(filter?: 'daily' | 'weekly' | 'monthly' | 'all')`
- **Purpose**: Retrieves goals with optional frequency filter
- **Authentication**: Requires authenticated user
- **Parameters**: Optional filter string
- **Behavior**:
  - If filter provided (not 'all'), uses case-insensitive LIKE query on `target` field
  - Returns all goals if filter is 'all' or not provided
- **Returns**: `{ data: Goal[], error: null }` or `{ error: string, data: [] }`
- **Ordering**: Most recently updated first (descending by `updated_at`)

---

## Relaxation

**Location**: `app/relaxation/actions.ts`

### Constants

#### `RELAXATION_ACTIVITIES: RelaxationActivity[]`
- **Purpose**: Predefined list of relaxation activities with mood-based filtering
- **Total Activities**: 9 activities
- **Categories**: mindfulness, movement, leisure, nature, exercise, creativity
- **Structure**: Each activity has:
  - `id`: Unique identifier
  - `title`: Activity name
  - `description`: Detailed explanation
  - `image`: Unsplash image URL
  - `category`: Activity type
  - `minMood`: Minimum mood rating (1-5)
  - `maxMood`: Maximum mood rating (1-5)

**Activity Distribution**:
- **Low Mood (1-2)**: Deep Breathing, Gentle Stretching, Calming Music
- **Neutral Mood (2-4)**: Nature Walk, Reading, Mindful Tea/Coffee
- **High Mood (4-5)**: Running/Jogging, Vinyasa Yoga, Creative Writing

### Server Actions

#### `getRelaxationSuggestions()`
- **Purpose**: Returns mood-based relaxation activity suggestions
- **Authentication**: Requires authenticated user
- **Behavior**:
  1. Checks if user logged mood today
  2. If no mood logged: Returns empty activities with message
  3. If mood logged: Filters activities where `moodRating >= minMood && moodRating <= maxMood`
  4. Fallback: If no matches, returns neutral activities (minMood ≤ 3, maxMood ≥ 3)
  5. Generates contextual message based on mood rating
- **Returns**:
  ```typescript
  {
    error: null,
    activities: RelaxationActivity[],
    moodRating: number | null,
    message: string,
    hasLoggedMoodToday: boolean
  }
  ```
- **Messages**:
  - Mood ≤ 2: "It looks like you're having a tough time. Here are some gentle ways to take care of yourself."
  - Mood = 3: "You're feeling okay. Here are some activities to maintain your balance."
  - Mood ≥ 4: "You're feeling great! Here are some ways to channel that positive energy."

#### `saveRelaxationSuggestion(activityId: string)`
- **Purpose**: Saves selected relaxation activity to database
- **Authentication**: Requires authenticated user
- **Behavior**:
  1. Retrieves most recent mood entry
  2. Finds activity by ID in `RELAXATION_ACTIVITIES`
  3. Stores activity as JSON in `relaxation_suggestions` table
- **Returns**: `{ success: true }` or `{ error: string }`
- **Database Table**: `relaxation_suggestions` (user_id, mood_id, activity_suggestion)

#### `saveSelectedActivities(activityIds: string[])`
- **Purpose**: Saves multiple selected relaxation activities to database
- **Authentication**: Requires authenticated user
- **Parameters**: Array of activity IDs
- **Validation**:
  - At least 1 activity must be selected
  - Maximum: All available activities
  - All IDs must match valid activities
- **Behavior**:
  1. Retrieves most recent mood entry
  2. Filters activities to only valid selections
  3. Performs batch insert of all selected activities
  4. Each activity stored as JSON in separate row
- **Returns**: `{ success: true, count: number, message: string }` or `{ error: string }`
- **Database Table**: `relaxation_suggestions` (user_id, mood_id, activity_suggestion, created_at)

**Type Definitions**:
```typescript
type RelaxationActivity = {
  id: string
  title: string
  description: string
  image: string
  category: string
  minMood: number
  maxMood: number
}
```

---

## Visualization

**Location**: `app/visualization/actions.ts`

### Server Actions

#### `getMoodVisualization(period: 'weekly' | 'monthly' = 'monthly')`
- **Purpose**: Retrieves mood data for visualization charts
- **Authentication**: Requires authenticated user
- **Parameters**: Period for data range (defaults to monthly)
- **Behavior**:
  - **Weekly**: Last 7 days of data
  - **Monthly**: Last 30 days of data
  - Calculates mood statistics
  - Generates weekly mood grid (Mon-Sun)
- **Returns**:
  ```typescript
  {
    data: MoodData[] | null,
    error: string | null,
    stats: MoodStats | null,
    weeklyMoods: WeeklyMood[] | null
  }
  ```

#### `getUserProfile()`
- **Purpose**: Retrieves user profile for visualization page header
- **Authentication**: Requires authenticated user
- **Returns**:
  ```typescript
  {
    username: string,
    full_name: string | null,
    physicalHealth: {
      weight?: number,
      height?: number
    } | null
  }
  ```
- **Behavior**: Parses latest physical health JSON to extract weight/height

### Helper Functions

#### `calculateMoodStats(moods: MoodData[]): MoodStats`
- **Purpose**: Calculates statistical data from mood entries
- **Calculations**:
  - `highest`: Maximum mood rating
  - `lowest`: Minimum mood rating
  - `average`: Mean mood rating (rounded to 1 decimal)
  - `healthScore`: Percentage score (average / 5 * 100)
  - `totalEntries`: Count of mood entries
- **Returns**: MoodStats object

#### `getWeeklyMoods(moods: MoodData[]): WeeklyMood[]`
- **Purpose**: Generates 7-day mood grid starting from Monday
- **Behavior**:
  - Adjusts Sunday (0) to be day 6 in week
  - Finds mood entry for each day
  - Assigns emoji based on mood rating
- **Returns**: Array of 7 WeeklyMood objects (Mon-Sun)

#### `getMoodEmoji(rating: number | null): string`
- **Purpose**: Converts mood rating to emoji
- **Mapping**:
  - 5: 😊 (Very Happy)
  - 4: 🙂 (Happy)
  - 3: 😐 (Neutral)
  - 2: 😰 (Anxious)
  - 1: 😢 (Sad)
  - null: 😐 (No data)

**Type Definitions**:
```typescript
type MoodData = {
  id: string
  mood_rating: number
  mood_at: string
  created_at: string
}

type MoodStats = {
  highest: number
  lowest: number
  average: number
  healthScore: number
  totalEntries: number
}

type WeeklyMood = {
  day: string
  mood: number | null
  emoji: string
}
```

---

## Articles

**Location**: `app/articles/actions.ts`

### Server Actions

#### `getArticles()`
- **Purpose**: Retrieves all mental health articles
- **Authentication**: None (public access)
- **Returns**: `{ data: Article[], error: null }` or `{ error: string, data: null }`
- **Ordering**: Most recent first (descending by `date_published`)

#### `getArticleById(id: string)`
- **Purpose**: Retrieves a single article by ID
- **Authentication**: None (public access)
- **Returns**: `{ data: Article, error: null }` or `{ error: string, data: null }`

#### `searchArticles(query: string)`
- **Purpose**: Searches articles by title or content
- **Authentication**: None (public access)
- **Parameters**: Search query string
- **Behavior**: Case-insensitive search using `ilike` on both `title` and `content` fields
- **Returns**: `{ data: Article[], error: null }` or `{ error: string, data: null }`
- **Ordering**: Most recent first (descending by `date_published`)

---

## Settings

**Location**: `app/settings/actions.ts`

### Server Actions

#### `getUserProfile()`
- **Purpose**: Retrieves user profile data for settings page
- **Authentication**: Requires authenticated user
- **Returns**:
  ```typescript
  {
    user: {
      id: string,
      email: string,
      created_at: string,
      full_name?: string,
      username?: string,
      phone_number?: string
    },
    error: string | null
  }
  ```
- **Behavior**: Merges Supabase auth user with users table data

#### `updateProfile(formData: FormData)`
- **Purpose**: Updates user profile information
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `full_name`, `username`, `phone`
- **Behavior**:
  - Updates `full_name`, `username`, `phone_number` fields
  - Sets `updated_at` to current timestamp
  - **Note**: `phone` parameter maps to `phone_number` column in database
- **Returns**: `{ success: true }` or `{ error: string }`
- **Revalidates**: `/settings` layout

#### `updateEmail(formData: FormData)`
- **Purpose**: Initiates email change process
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `email`
- **Validation**: Email is required
- **Behavior**: Sends confirmation email to new address
- **Returns**: `{ success: true, message: string }` or `{ error: string }`
- **Message**: "Check your new email to confirm the change"

#### `updatePassword(formData: FormData)`
- **Purpose**: Updates user password
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `password` and `confirm_password`
- **Validation**:
  - Password must be at least 6 characters
  - Password and confirm_password must match
- **Returns**: `{ success: true, message: string }` or `{ error: string }`

#### `deleteAccount(formData: FormData)`
- **Purpose**: Permanently deletes user account
- **Authentication**: Requires authenticated user
- **Parameters**: FormData containing `confirmation` (must be "DELETE")
- **Validation**: User must type "DELETE" to confirm
- **Behavior**:
  1. Deletes user data from users table
  2. Calls `delete_user` RPC to delete auth user
  3. Signs out user
  4. Redirects to login page
- **Warning**: Irreversible action
- **Returns**: `{ error: string }` on failure, redirects on success

#### `exportUserData()`
- **Purpose**: Exports all user data as JSON
- **Authentication**: Requires authenticated user
- **Returns**: JSON object containing:
  - `userData`: Profile from users table
  - `goals`: All goal entries
  - `journals`: All journal entries
  - `moods`: All mood logs
  - `physicalHealth`: All physical health entries
  - `exportedAt`: Export timestamp
- **Use Case**: GDPR compliance, data portability

#### `logout()`
- **Purpose**: Signs out user and clears session
- **Authentication**: Requires authenticated user
- **Behavior**:
  1. Calls `signOut({ scope: 'global' })`
  2. Explicitly clears all Supabase auth cookies (cookies starting with 'sb-')
  3. Redirects to login page
- **Cookie Clearing**: Prevents back-navigation session restore

#### `getAccountStats()`
- **Purpose**: Retrieves user activity statistics
- **Authentication**: Requires authenticated user
- **Returns**:
  ```typescript
  {
    goalsCount: number,
    journalsCount: number,
    moodsCount: number
  }
  ```
- **Behavior**: Uses Supabase `count` with `head: true` for efficient counting

---

## API Routes

### Login Route

**Location**: `app/api/auth/login/route.ts`

#### `POST /api/auth/login`
- **Purpose**: Alternative login endpoint using Next.js API routes
- **Method**: POST
- **Parameters**: FormData containing `email` and `password`
- **Behavior**:
  1. Validates email and password are provided
  2. Creates Supabase server client with cookie handling
  3. Calls `signInWithPassword()`
  4. Sets auth cookies on response object
  5. Redirects to `/dashboard` on success
- **Error Handling**: Redirects to `/error?reason=login_failed`
- **Returns**: NextResponse redirect
- **Cookie Management**: Uses createServerClient with custom cookie setters

---

## Authentication Patterns

### Server vs Client Functions

**Server Actions** (`'use server'`):
- Used for: Form submissions, redirects, database operations
- Location: `actions.ts` files
- Authentication: Uses `createClient()` from `utils/supabase/server.ts`
- Cookie Handling: Automatic via Next.js `cookies()` API
- Redirects: Uses `redirect()` from `next/navigation`

**Client Functions** (`'use client'`):
- Used for: Interactive features, real-time feedback
- Location: `clientAuth.ts` or client components
- Authentication: Uses `createBrowserClient()` from `utils/supabase/client.ts`
- Returns: Error objects for client-side handling
- Examples: OTP verification, password reset validation

---

## Common Patterns

### Authentication Check
All server actions follow this pattern:
```typescript
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  redirect('/login')
}
```

### Error Handling
```typescript
if (error) {
  console.error('Error description:', error)
  return { error: error.message }
}

return { success: true, data }
```

### Revalidation
After mutations, revalidate affected paths:
```typescript
revalidatePath('/page-path', 'layout')
```

### Daily Data Logic
For features that track "today" (mood, physical health):
```typescript
const now = new Date()
const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

const { data } = await supabase
  .from('table')
  .select('*')
  .gte('created_at', startOfDay.toISOString())
  .lt('created_at', endOfDay.toISOString())
```

---

## Database Column Mappings

### User Profile
- `full_name` ✓
- `username` ✓
- `phone_number` ✓ (form field uses `phone`)
- ~~`bio`~~ (removed)
- ~~`location`~~ (removed)

### Physical Health
- Data stored as JSON in `complaints` field:
  - `weight`
  - `sleepHours`
  - `stepCounts`
  - `date`

### Goals
- `name`: Goal description
- `target`: Frequency/due date ("Indefinite", date string, or text with "daily")
- `progress`: "Not Started", "In Progress", "Completed"

---

## Algorithms & Business Logic

### Stress Level Calculation
```typescript
stressLevel = Math.round((1 - (avgMood / 5)) * 100)
```
- Range: 0-100%
- Based on 7-day mood average
- Lower mood = higher stress

### Health Score Calculation
```typescript
healthScore = Math.round((averageMood / 5) * 100)
```
- Range: 0-100%
- Higher mood = higher health score

### Today's Goals Filter
Goals shown on dashboard if:
1. `target` equals today's date (YYYY-MM-DD), OR
2. `target` equals "Indefinite", OR
3. `target` contains "daily" (case-insensitive)

### Mood-Based Activity Filtering
```typescript
filteredActivities = RELAXATION_ACTIVITIES.filter(
  activity => moodRating >= activity.minMood && moodRating <= activity.maxMood
)
```
- User's current mood must fall within activity's mood range
- Ensures suggestions are appropriate for emotional state

---

## Summary Statistics

- **Total Server Actions**: 36+
- **Total Client Functions**: 5
- **API Routes**: 1
- **Feature Modules**: 10
- **Database Tables Used**: 8 (users, moods, journal, goal, physical_health, articles, relaxation_suggestions, auth tables)

---

*Last Updated: 2026-01-07*
