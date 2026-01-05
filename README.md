# Lifegrid

A life logging application for tracking time, spending, and reflections. Built with Next.js, Supabase, and Tailwind CSS.

## Philosophy

Lifegrid is an intentional, timeless tool for observing your life. It does not judge, gamify, or optimize. It simply allows you to log every hour of every day and reflect on how you spend your time.

**Design Principles:**
- Calm over clever
- White space over decoration
- Typography over UI chrome
- Color as meaning, not flair
- Dark mode first

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** shadcn/ui
- **Fonts:** Geist & Geist Mono

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lifegrid
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from Settings → API
3. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Database Migrations

Navigate to your Supabase project dashboard → SQL Editor.

Run each script in `/scripts/` **in order**:

1. `001_create_users_extension.sql` - User profiles
2. `002_create_categories.sql` - Default life categories
3. `003_create_days_and_hours.sql` - Core time tracking tables
4. `004_create_spend_entries.sql` - Spending tracker
5. `005_create_food_and_media.sql` - Food & media logging
6. `006_create_travel.sql` - Travel tracking

See `/scripts/README.md` for details.

### 4. Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. First Use

1. You'll be redirected to `/auth`
2. Sign up with email and password
3. Your timezone will be auto-detected
4. You'll land on "Today" — start logging your hours

## Core Features

### Day View (`/today`)
- 24-hour grid (0-23)
- Click to assign a category
- Click + drag to paint multiple hours
- Right-click or Cmd+click to clear
- Navigate between days
- Add daily highlights and notes
- **Task management** with Grid/Tasks toggle
- **Recurring tasks** that auto-populate daily

### Year View (`/year`)
- Visual grid of the entire year
- Each day colored by dominant category
- Opacity reflects hours logged
- See patterns at a glance

### Analytics (`/analytics`)
- Category breakdown
- Time range filters (week/month/year)
- Observational, not prescriptive

### Spending (`/spending`)
- Log expenses by date
- Category totals
- Simple, judgment-free tracking

### Reflection (`/reflection`)
- Browse your daily notes and highlights
- Chronological journal

### Settings (`/settings`)
- Update timezone
- Export all data (JSON or CSV)
- Full data ownership

## Categories

Lifegrid ships with 12 carefully chosen categories:

1. Sleep - `#2C2F4A`
2. Work - `#7A1F2B`
3. Hobbies / Projects - `#C97A2B`
4. Freelance - `#8E5EA2`
5. Exercise - `#2F7D6D`
6. Friends - `#4A90A4`
7. Relaxation & Leisure - `#6B7C85`
8. Dating / Partner - `#B56A7A`
9. Family - `#8C6D4F`
10. Productive / Chores - `#5F6A3D`
11. Travel - `#3E5C76`
12. Misc / Getting Ready - `#4B4B4B`

**These colors are sacred.** Do not modify them after setup.

## Project Structure

```
lifegrid/
├── app/
│   ├── (app)/              # Protected routes with sidebar
│   │   ├── analytics/
│   │   ├── reflection/
│   │   ├── settings/
│   │   ├── spending/
│   │   ├── today/          # Main day view
│   │   ├── year/
│   │   └── layout.tsx
│   ├── auth/               # Auth page
│   ├── globals.css         # Design system
│   └── layout.tsx
├── components/
│   ├── hour-grid.tsx       # Hour logging UI
│   ├── sidebar.tsx         # Navigation
│   └── ui/                 # shadcn components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
├── scripts/                # SQL migrations
└── proxy.ts                # Auth routing (Next.js 16)
```

## Development Notes

- **Auth:** Supabase Auth with middleware-based route protection
- **RLS:** All tables have Row Level Security enabled
- **Timezone:** Auto-detected on signup, stored per user
- **Data ownership:** Full export capability (JSON/CSV)

## Contributing

This is a personal life logging tool. Contributions should align with the core philosophy:

- No gamification
- No social features
- No AI coaching
- No motivational copy

Build this like someone will use it for the next 10 years.

## License

MIT
