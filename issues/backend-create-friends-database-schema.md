# backend: Create Database Schema for Friends System

**Type:** Backend / Database  
**Priority:** Medium

## Problem

We need to implement a friends/social feature that allows users to:
- Follow other users
- View friends' public data in leaderboards
- See friends' schedules/grids (if made public)
- Manage friend relationships

## Solution

Create database tables and relationships:
1. `friendships` table for user relationships
2. `user_privacy_settings` table for controlling what data is public
3. Proper RLS policies for friend data access
4. Indexes for performance

## Database Schema Design

### Friendships Table:
- `id` (UUID, primary key)
- `user_id` (UUID, references users)
- `friend_id` (UUID, references users)
- `status` (enum: 'pending', 'accepted', 'blocked')
- `created_at`, `updated_at`
- Unique constraint on (user_id, friend_id)
- Check constraint: user_id != friend_id

### User Privacy Settings Table:
- `id` (UUID, primary key)
- `user_id` (UUID, references users, unique)
- `fitness_public` (boolean, default false)
- `analytics_public` (boolean, default false)
- `schedule_public` (boolean, default false)
- `grid_public` (boolean, default false)
- `created_at`, `updated_at`

## Why This Approach

- Separate tables keep concerns clear
- Privacy settings are user-scoped
- Friendship status supports pending/blocked states
- RLS enforces access control

## Acceptance Criteria

- [ ] `friendships` table created with proper constraints
- [ ] `user_privacy_settings` table created
- [ ] RLS policies allow users to view their own friendships
- [ ] RLS policies allow users to view friends' public data
- [ ] Indexes created for common queries (user_id, friend_id, status)
- [ ] Migration script created and documented
- [ ] Foreign key constraints properly set up

## Implementation Ideas

- Create migration script: `017_create_friends_system.sql`
- Use Supabase RLS for access control
- Consider bidirectional friendships vs one-way follows
- Add triggers for updated_at timestamps
- Consider adding a `mutual` computed field or view

## Files to Create

- `scripts/017_create_friends_system.sql` - Main migration script
- Update `scripts/README.md` with new migration info

## Related Issues

- Prerequisite for: `frontend: Build Friends Management UI`
- Prerequisite for: `frontend: Implement Privacy Settings UI`
- Prerequisite for: `frontend+backend: Create Leaderboard Feature`

