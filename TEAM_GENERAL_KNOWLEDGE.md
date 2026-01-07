# Team General Knowledge - Mental Health Web Application

**Document Purpose**: This guide provides general knowledge about the Mental Health Web Application project for all team members across frontend, backend, system analyst, QA, and UI/UX roles.

---

## 1. Project Overview

### What We're Building
A comprehensive mental health tracking and support web application that helps users monitor and improve their mental wellbeing through:
- Daily mood tracking
- Personal journaling
- Physical health monitoring
- Goal management
- Personalized relaxation activities
- Mental health educational articles
- Data visualization and insights

### Project Goals
- Provide an accessible, user-friendly platform for mental health self-care
- Help users identify patterns in their mood and behavior
- Offer personalized recommendations based on user's current state
- Create a safe, private space for mental health tracking

### Target Users
- Individuals seeking to monitor their mental health
- People wanting to track mood patterns and triggers
- Users looking for guided relaxation and self-care activities
- Anyone interested in understanding the connection between physical and mental health

---

## 2. System Architecture (High-Level)

### How the Application Works

```
User's Browser
     ↓
Next.js Frontend (React)
     ↓
Server Actions / API Routes
     ↓
Supabase (Authentication + Database)
     ↓
PostgreSQL Database
```

### Key Components

1. **Frontend (What Users See)**
   - Built with React and Next.js
   - Responsive design works on mobile, tablet, and desktop
   - Interactive forms and visualizations

2. **Backend (Behind the Scenes)**
   - Server-side logic using Next.js Server Actions
   - Authentication and authorization
   - Data processing and validation

3. **Database (Where Data Lives)**
   - Supabase PostgreSQL database
   - Stores user profiles, mood logs, journals, goals, etc.
   - Row-level security protects user privacy

4. **Authentication (Keeping It Secure)**
   - Supabase Auth handles user login/registration
   - Cookie-based sessions
   - Password + OTP (One-Time Password) options

---

## 3. Core Features

### Dashboard
- Central hub showing overview of user's mental health status
- Displays today's mood, recent journal entries, active goals
- Shows personalized relaxation suggestions
- Quick access to all features

### Mood Tracking
- Users rate their mood on a 1-5 scale daily
- One mood entry per day (can be updated)
- Mood data drives personalized recommendations
- Used to calculate stress levels and patterns

### Journal
- Private digital diary for thoughts and reflections
- Create, edit, delete entries
- Shows recent entries on dashboard
- Helps users process emotions and track mental health journey

### Physical Health Tracking
- Log weight, sleep hours, and daily steps
- One entry per day
- Helps identify correlation between physical and mental health
- Dashboard shows latest metrics

### Goals Management
- Set and track personal goals
- Mark goals as "In Progress" or "Completed"
- Can set target dates or mark as "Indefinite"
- Dashboard highlights today's goals and daily goals

### Relaxation Activities
- Personalized activity suggestions based on current mood
- Different activities for low, neutral, and high moods
- Users can select and save multiple activities to try
- Includes breathing exercises, stretching, music, walks, etc.

### Mental Health Articles
- Curated educational content
- Pre-populated articles covering various mental health topics
- Searchable and browsable
- Helps users learn coping strategies

### Data Visualization
- Charts showing mood trends over time
- Physical health metrics visualization
- Helps users identify patterns and progress

### Settings/Profile
- Update username, full name, phone number
- Change password
- Manage account settings

---

## 4. Technology Stack

### Frontend
- **Next.js 16** - React framework for web applications
- **React 19** - UI component library
- **TypeScript** - Adds type safety to JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework for styling

### Backend
- **Next.js Server Actions** - Server-side functions
- **Supabase** - Backend-as-a-Service (authentication + database)
- **PostgreSQL** - Relational database

### Development Tools
- **npm** - Package manager
- **Git** - Version control
- **VS Code** - Code editor (recommended)

### Deployment
- **Docker** - Containerization for consistent deployment
- Production environment uses Docker Compose

---

## 5. Development Workflow

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (`.env.local`)
4. Start development server: `npm run dev`
5. Access at `http://localhost:3000`

### Git Workflow
1. Pull latest changes from `main` branch
2. Create a new branch for your feature/fix
3. Make changes and commit regularly
4. Push your branch and create a pull request
5. After review, merge to `main`

### Code Organization
```
app/                    # Application pages and routes
  ├── dashboard/       # Dashboard feature
  ├── mood/            # Mood tracking feature
  ├── journal/         # Journal feature
  ├── (etc...)         # Other features
  └── api/             # API routes

components/            # Reusable UI components
utils/                 # Helper functions and utilities
public/                # Static assets (images, etc.)
```

### Common Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Check code quality

---

## 6. Team Roles & Responsibilities

### Frontend Developer
- Build user interface components
- Implement page layouts and navigation
- Handle form inputs and user interactions
- Ensure responsive design across devices
- Connect UI to backend via server actions

### Backend Developer
- Create server actions for data operations
- Set up database schema and migrations
- Implement authentication logic
- Write business logic (calculations, filtering)
- Ensure data security and validation

### System Analyst
- Define system requirements
- Map user stories to technical features
- Document data flow and system architecture
- Bridge communication between technical and non-technical stakeholders
- Ensure features meet user needs

### Quality Analyst (QA)
- Test all features for bugs and issues
- Verify user flows work as expected
- Check responsive design across devices
- Test edge cases and error handling
- Document bugs and retest after fixes

### UI/UX Designer
- Design user interface mockups
- Create user experience flows
- Define color schemes and branding
- Ensure accessibility standards
- Conduct usability testing and gather feedback

### How Roles Interact
- **SA → Frontend/Backend**: Provides requirements and specifications
- **UI/UX → Frontend**: Provides designs and user experience guidelines
- **Backend → Frontend**: Provides API functions and data structures
- **QA → All**: Reports bugs and verifies fixes across all areas
- **All → Team Lead**: Coordinate progress and resolve blockers

---

## 7. Core Concepts & Terminology

### Authentication & Authorization
- **Authentication**: Verifying who the user is (login)
- **Authorization**: Checking what the user can access
- **Session**: User's logged-in state stored in cookies
- **JWT**: JSON Web Token (not used here, we use cookie sessions)

### Database Concepts
- **Table**: Collection of related data (like "moods" or "users")
- **Row**: A single record in a table (one user's mood entry)
- **Column**: A field in a table (like "mood_rating" or "username")
- **Primary Key**: Unique identifier for each row (usually "id")
- **Foreign Key**: Reference to another table's primary key (links data)
- **RLS (Row Level Security)**: Database-level privacy controls

### Frontend Concepts
- **Component**: Reusable piece of UI (like a button or card)
- **State**: Data that changes over time (form inputs, loading status)
- **Props**: Data passed from parent to child component
- **Server Action**: Function that runs on the server, called from client
- **Client Component**: Runs in the user's browser
- **Server Component**: Runs on the server before sending HTML to browser

### Feature-Specific Terms
- **Mood Rating**: 1-5 scale (1 = very low, 5 = very good)
- **Mood Entry**: A single mood log with rating and timestamp
- **Stress Level**: Calculated as `1 - (avg mood / 5)`, shown as percentage
- **Activity Suggestion**: Relaxation activity recommended based on mood
- **Goal Progress**: Status of goal ("In Progress" or "Completed")
- **Physical Health Entry**: Daily log of weight, sleep, and steps

---

## 8. User Privacy & Security

### How We Protect Users
1. **Password Hashing**: Passwords never stored in plain text
2. **Row-Level Security**: Users can only see their own data
3. **HTTP-Only Cookies**: Session tokens protected from JavaScript access
4. **Server-Side Validation**: All data validated before saving
5. **No Data Sharing**: User data never shared with third parties

### What Users Can Do
- Create an account with email and password
- Log in with password or OTP (one-time password)
- Reset password via email
- Delete their data by deleting account
- Update profile information

---

## 9. Common Questions

### Q: How often can users log their mood?
**A**: Once per day. They can update it throughout the day, but only one entry per 24-hour period.

### Q: How are relaxation activities chosen?
**A**: Based on the user's most recent mood rating. Low moods get gentle activities (breathing, stretching), high moods get active ones (running, creative writing).

### Q: Where is the data stored?
**A**: In a Supabase PostgreSQL database. Each user's data is isolated via row-level security.

### Q: Can users see other users' data?
**A**: No. The database enforces that users can only access their own data.

### Q: How do we calculate stress level?
**A**: `Stress = (1 - average_mood_last_7_days / 5) × 100%`

### Q: What happens if a user forgets their password?
**A**: They can use the password reset flow, which sends a reset link to their email.

### Q: Is the app mobile-friendly?
**A**: Yes. The UI is fully responsive and works on phones, tablets, and desktops.

---

## 10. Where to Find More Information

### For All Team Members
- **This Document** - General knowledge for everyone
- **README.md** - Project setup and quick start
- **CLAUDE.md** - Architecture and implementation patterns

### Role-Specific Documentation
- **Frontend/Backend Developers**:
  - `FEATURE_FUNCTIONS.md` - Complete API reference
  - `BACKEND_AND_LEADERSHIP_GUIDE.md` - Technical deep dive

- **Project Presentation/Defense**:
  - `PROJECT_PRESENTATION_GUIDE.md` - Academic presentation guide

### Code Documentation
- **Server Actions**: Look in `app/[feature]/actions.ts` files
- **Page Components**: Look in `app/[feature]/page.tsx` files
- **Reusable Components**: Look in `components/` directory
- **Type Definitions**: Check TypeScript interfaces in action files

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 11. Quick Reference

### Key Files
- `app/dashboard/page.tsx` - Main dashboard UI
- `app/dashboard/actions.ts` - Dashboard data aggregation
- `components/Navbar.tsx` - Navigation sidebar
- `utils/supabase/server.ts` - Database client (server)
- `utils/supabase/client.ts` - Database client (browser)
- `.env.local` - Environment variables (DO NOT COMMIT)

### Database Tables
1. `users` - User profiles (username, full_name, phone_number)
2. `moods` - Mood entries (mood_rating, mood_at, user_id)
3. `physical_health` - Health metrics (complaints JSON, user_id)
4. `journal` - Journal entries (title, content, user_id)
5. `goal` - User goals (name, target, progress, user_id)
6. `articles` - Mental health articles (title, content)
7. `relaxation_suggestions` - Saved activities (activity_suggestion, user_id)
8. `visualizations` - (Future use for charts/graphs)

### Color Palette
- Primary Green: `#A4B870`
- Darker Green: `#6E8450`
- Coral Accent: `#FF8C69`
- Neutral Background: `#F5F5F0`

### Important Constraints
- **1 mood per day** per user
- **1 physical health entry per day** per user
- **Mood rating**: Must be 1-5
- **Phone number field**: Database uses `phone_number`, not `phone`
- **Goal target**: Can be a date or "Indefinite"

---

## 12. Getting Help

### If You're Stuck
1. Check this document for general concepts
2. Review role-specific documentation
3. Look at existing code for similar features
4. Ask team members in your domain
5. Consult the team lead for blockers

### Reporting Issues
- **Bugs**: Report to QA or create a GitHub issue
- **Design Questions**: Consult UI/UX team member
- **Technical Questions**: Ask relevant developer (frontend/backend)
- **Requirement Clarifications**: Check with System Analyst

### Best Practices
- **Commit Often**: Small, frequent commits with clear messages
- **Test Your Changes**: Verify everything works before pushing
- **Ask Questions**: Better to ask than to guess
- **Document Complex Logic**: Leave comments for tricky code
- **Follow Existing Patterns**: Look at similar features for guidance

---

**Last Updated**: January 2026
**Project Status**: Active Development
**Team Size**: 5 members (Frontend, Backend, SA, QA, UI/UX)

---

**Welcome to the team! This project aims to make a positive impact on mental health awareness and self-care. Your contributions matter.**
