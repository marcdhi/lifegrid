# Lifegrid - Quick Start Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- A Supabase account (free tier works)

## Setup (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name and password
4. Wait for project to provision (~2 minutes)

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then fill in your Supabase credentials:

1. Go to Project Settings → API
2. Copy "Project URL" → paste as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Run Database Migrations

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Run each file in `/scripts/` folder **in order** (001 through 006)
4. Each script should show "Success. No rows returned"

**Important:** Run them in order or the foreign keys will fail.

### 5. Start the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Sign Up

1. You'll be redirected to `/auth`
2. Click "Sign up"
3. Enter email and password (6+ characters)
4. Your timezone will be auto-detected
5. You'll land on "Today" - start logging!

## First Steps

### Log Your First Hour

1. On the "Today" page, you'll see a 6x4 grid (24 hours)
2. Click any hour (0-23)
3. Pick a category from the popup
4. The cell fills with that category's color

### Paint Multiple Hours

1. Click a category from the palette at the bottom
2. Now click and drag across hours
3. They'll all get painted with that category
4. Right-click or Cmd+click to clear an hour

### Add Daily Notes

Scroll down to see:
- **Highlights:** What stood out today?
- **Notes:** Any other thoughts

Both auto-save as you type.

### Explore Other Views

- **Year:** See your entire year as a color grid
- **Analytics:** Category breakdown and stats
- **Spending:** Track expenses
- **Reflection:** Browse your daily notes
- **Settings:** Export data, change timezone

## Common Issues

### "Failed to fetch" error
→ Check your `.env.local` file has correct Supabase credentials

### Categories not showing
→ Did you run `002_create_categories.sql`?

### Can't log hours
→ Did you run all 6 migration scripts in order?

### Auth not working
→ Check Supabase project isn't paused (free tier pauses after 7 days inactivity)

## Data Ownership

You own your data completely:

1. Go to Settings
2. Click "Export as JSON" or "Export Hours as CSV"
3. All your data downloads immediately

No lock-in. Ever.

## Philosophy Reminder

Lifegrid observes. It does not judge.

- Empty hours are intentional
- There are no streaks
- There is no gamification
- There is no "optimal" day

This is a tool for seeing, not optimizing.

Build this like you'll use it for the next 10 years.

---

Need help? Check the main README.md for detailed documentation.

