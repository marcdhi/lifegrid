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
007_update_category_colors.sql
008_create_fitness_tables.sql
009_add_duration_to_hour_logs.sql
010_add_start_offset_to_hour_logs.sql
011_create_tasks.sql
012_update_categories_user.sql
013_allow_update_system_categories.sql
014_add_exercise_images.sql
015_add_recurring_tasks.sql
```

## What Each Script Does

- **001**: Extends Supabase Auth with user profiles (timezone, etc.)
- **002**: Creates 12 default life categories with exact colors
- **003**: Creates Days and Hour Logs tables (core time tracking)
- **004**: Creates spending tracking table
- **005**: Creates food and media logging tables
- **006**: Creates travel tracking table
- **007**: Updates category colors
- **008**: Creates fitness tracking tables
- **009**: Adds duration support to hour logs
- **010**: Adds start offset for precise time tracking
- **011**: Creates tasks table for daily task management
- **012**: Updates categories with user association
- **013**: Allows updating system categories
- **014**: Adds exercise images
- **015**: Adds recurring tasks support (NEW)

## Important Notes

- RLS (Row Level Security) is enabled on all tables
- Users can only access their own data
- Categories are globally readable
- Do not modify category colors after creation (color consistency is critical)

## Recurring Tasks (015)

The newest feature allows users to create tasks that automatically appear on every future day:

- Mark any task as "recurring" with the Repeat icon
- Recurring tasks auto-populate on all future days
- Each day gets its own instance (can be completed independently)
- Delete the template to remove all instances
- Perfect for daily routines like "Sleep", "Exercise", "Meditation", etc.

