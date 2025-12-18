# Mental Health Web App

A comprehensive mental health and wellness tracking application built with Next.js, React, and Supabase.

## Overview

This application helps users track and manage their mental and physical wellbeing through multiple features including mood logging, journaling, goal setting, physical health tracking, and personalized relaxation suggestions.

## Features

- **Dashboard** - Centralized view of mood trends, stress levels, goals, journal entries, and health metrics
- **Daily Mood Logging** - Track your mood with a visual 5-point scale (one entry per day with option to update)
- **Journal** - Write and manage personal journal entries with a rich text editor interface
- **Goals Management** - Set and track personal goals with progress monitoring
- **Physical Health Tracking** - Log step counts, sleep hours, and weight
- **Relaxation Suggestions** - Get personalized activity recommendations based on your current mood
- **Data Visualization** - View mood trends, stress levels, and health metrics over time
- **Articles** - Access mental health resources and informational articles
- **User Settings** - Manage profile and account preferences

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Authentication & Database**: Supabase
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20 or higher
- A Supabase account and project

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd MentalHealthWebApp-Frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

   Get these values from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api)

4. Set up the database

   You'll need to create the following tables in your Supabase project:
   - `users` - User profiles (username, full_name)
   - `moods` - Mood tracking entries
   - `journal` - Journal entries
   - `goal` - User goals
   - `physical_health` - Physical health metrics
   - `articles` - Mental health articles
   - `relaxation_activities` - Relaxation suggestions

5. Run the development server
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── dashboard/          # Main dashboard with aggregated data
├── mood/              # Mood logging interface
├── journal/           # Journal editor
├── goals/             # Goal management
├── physical-health/   # Health tracking
├── relaxation/        # Relaxation activity suggestions
├── visualization/     # Data charts and insights
├── articles/          # Mental health articles
├── settings/          # User settings and profile
├── login/             # Authentication pages
├── register/
└── api/               # API routes

components/
└── Navbar.tsx         # Main navigation component

utils/
└── supabase/          # Supabase client configuration
```

## Architecture

This application uses:
- **Server Actions** for data mutations and authentication checks
- **Cookie-based authentication** via Supabase SSR
- **Server-side rendering** for improved performance and SEO
- **Client components** for interactive UI elements

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Color Palette

- Primary Green: `#A4B870`
- Dark Green: `#6E8450`
- Coral: `#FF8C69`
- Neutral Background: `#F5F5F0`
- Purple: `#9B9BE8`
- Yellow: `#E5D68A`

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

## License

This project is licensed under the MIT License.
