# backend: Create Theme System Database Schema

**Type:** Backend / Database  
**Priority:** Medium

## Problem

Users want different color themes (not just the current peachy dark theme). We need to store theme configurations in the database and allow users to select their preferred theme.

## Solution

Create a theme system:
1. `themes` table for available themes
2. `user_themes` table for user theme preferences
3. Theme configuration stored as JSON (colors, CSS variables)
4. Default themes: Baby Powder, Light Mood, Pink Mood, Current (Peachy Dark)

## Database Schema Design

### Themes Table:
- `id` (UUID, primary key)
- `name` (text, e.g., "Baby Powder", "Light Mood")
- `slug` (text, unique, e.g., "baby-powder", "light-mood")
- `colors` (JSONB) - Stores theme color configuration
- `is_system` (boolean) - System themes vs custom
- `created_at`, `updated_at`

### User Themes Table:
- `id` (UUID, primary key)
- `user_id` (UUID, references users, unique)
- `theme_id` (UUID, references themes)
- `created_at`, `updated_at`

## Theme Color Structure (JSONB)

```json
{
  "background": "#FFFFFF",
  "foreground": "#000000",
  "primary": "#000000",
  "secondary": "#666666",
  "muted": "#999999",
  "card": "#F5F5F5",
  "accent": "#4ECDC4",
  "destructive": "#C24A4A",
  "border": "rgba(0, 0, 0, 0.1)"
}
```

## Why This Approach

- Themes stored in database allow for easy addition of new themes
- JSONB provides flexibility for theme configuration
- User preferences are separate from theme definitions
- Can support custom user themes in the future
- Efficient querying with proper indexes

## Acceptance Criteria

- [ ] `themes` table created with proper structure
- [ ] `user_themes` table created
- [ ] Default themes inserted (Baby Powder, Light Mood, Pink Mood, Current)
- [ ] RLS policies for themes (readable by all, writable by admins)
- [ ] RLS policies for user_themes (users manage own preferences)
- [ ] Indexes created for performance
- [ ] Migration script created and documented

## Implementation Ideas

- Create migration script: `018_create_themes_system.sql`
- Insert default themes with proper color configurations
- Consider adding a `preview_image` field for theme thumbnails
- Add validation for color format in JSONB
- Consider adding theme metadata (description, author, etc.)

## Files to Create

- `scripts/018_create_themes_system.sql` - Main migration script
- Update `scripts/README.md` with new migration info

## Related Issues

- Prerequisite for: `frontend: Implement Theme Selection UI`
- Prerequisite for: `frontend: Optimize Theme Loading and Caching`

