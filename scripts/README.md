# Database Migration Scripts

Run these SQL scripts **in order** in your Supabase SQL Editor.

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** → **New Query**
3. Run each script in numerical order:

```
001_create_users_extension.sql
002_create_categories.sql
003_create_days_and_hours.sql
004_create_spend_entries.sql
005_create_food_and_media.sql
006_create_travel.sql
```

## What Each Script Does

- **001**: Extends Supabase Auth with user profiles (timezone, etc.)
- **002**: Creates 12 default life categories with exact colors
- **003**: Creates Days and Hour Logs tables (core time tracking)
- **004**: Creates spending tracking table
- **005**: Creates food and media logging tables
- **006**: Creates travel tracking table

## Important Notes

- RLS (Row Level Security) is enabled on all tables
- Users can only access their own data
- Categories are globally readable
- Do not modify category colors after creation (color consistency is critical)

