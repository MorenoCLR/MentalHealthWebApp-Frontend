# Project Overview

This is a **Mental Health Web App** built with **Next.js 16 (App Router)** and **Supabase**. It provides features for tracking mental well-being, including journaling, mood tracking, goal setting, and physical health monitoring.

## Tech Stack

*   **Framework:** Next.js 16 (React 19)
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Styling:** Tailwind CSS (v4)
*   **Icons:** Lucide React
*   **Language:** TypeScript

## Architecture & Structure

*   **`app/`**: Next.js App Router structure.
    *   **Routes:** organized by feature (e.g., `journal/`, `mood/`, `goals/`).
    *   **Server Actions:** `actions.ts` files within feature directories handle form submissions and data mutations.
    *   **`api/`**: API routes (e.g., Auth handlers).
*   **`components/`**: Reusable UI components.
*   **`utils/supabase/`**: Supabase client initialization for Server (SSR), Client, and Middleware.
*   **`db/migrations/`**: SQL migration files for database schema setup.
*   **`public/`**: Static assets.

## Database Schema

The database relies on Supabase (PostgreSQL) with Row Level Security (RLS) enabled. Key tables include:

*   `users`: Extends Supabase Auth users.
*   `articles`: Publicly readable content.
*   `goal`: User-defined goals.
*   `journal`: Personal journal entries.
*   `moods`: Daily mood tracking (1-5 scale).
*   `physical_health`: Physical health tracking.
*   `relaxation_suggestions`, `positive_reinforcement_message`, `visualization`.

# Building and Running

## Prerequisites

*   Node.js (v18+ recommended)
*   Supabase Project (URL and Anon Key)

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_SUPABASE_ANON_KEY]
```

## Scripts

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Run Development Server:**
    ```bash
    npm run dev
    ```
*   **Build for Production:**
    ```bash
    npm run build
    ```
*   **Start Production Server:**
    ```bash
    npm run start
    ```
*   **Lint Code:**
    ```bash
    npm run lint
    ```

# Development Conventions

*   **Type Safety:** Strict TypeScript usage.
*   **Imports:** Use absolute imports with `@/` alias (e.g., `@/components/Navbar`).
*   **Styling:** Utility-first CSS with Tailwind.
*   **Data Fetching:** Prefer Server Components for fetching data and Server Actions for mutations.
*   **Authentication:** Uses `@supabase/ssr` for cookie-based authentication handling across Client/Server components and Middleware.
