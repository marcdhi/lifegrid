# frontend+backend: Create Leaderboard Feature

**Type:** Backend + Frontend / Feature  
**Priority:** Medium

## Problem

Users want to see leaderboards comparing their fitness and analytics data with friends. This adds a social/competitive element to the app.

## Solution

Create a leaderboard system:
1. Backend: Query friends' public data and aggregate metrics
2. Frontend: Display leaderboards with rankings
3. Support multiple leaderboard types (fitness, analytics, etc.)
4. Show only data from mutual friends or accepted friendships

## Backend Requirements

- Query friends where status = 'accepted'
- Filter by user privacy settings (only show public data)
- Aggregate metrics (workout completions, food entries, etc.)
- Sort by various metrics
- Handle edge cases (no friends, no public data)

## Frontend Requirements

- Leaderboard page/component
- Multiple leaderboard views (fitness, analytics)
- User rankings with avatars/initials
- Clear indication of current user's position
- Empty states when no data available

## UX Considerations

- Non-competitive, friendly presentation
- Clear metrics and what they mean
- Visual indicators for user's own position
- Easy to understand rankings
- Consider time periods (weekly, monthly, all-time)

## Acceptance Criteria

- [ ] Leaderboard page accessible from navigation
- [ ] Shows fitness metrics (workout completions, food entries)
- [ ] Shows analytics metrics (if applicable)
- [ ] Only displays data from friends with public settings
- [ ] Current user's position is highlighted
- [ ] Empty states when no friends or no public data
- [ ] Proper loading states
- [ ] Mobile-responsive design

## Implementation Ideas

- Create `app/(app)/leaderboard/page.tsx`
- Create Supabase functions or queries for leaderboard data
- Consider caching leaderboard data for performance
- Add date range filters (this week, this month, all time)
- Use Card components for leaderboard entries
- Consider adding badges or achievements

## Files to Create/Modify

- `app/(app)/leaderboard/page.tsx` - New leaderboard page
- `components/sidebar.tsx` - Add Leaderboard navigation link
- `lib/types.ts` - Add LeaderboardEntry type
- Consider creating `components/leaderboard-card.tsx` component

## Prerequisites

- `backend: Create Database Schema for Friends System` must be completed first
- `frontend: Implement Privacy Settings UI` should be completed

## Related Issues

- Depends on: `backend: Create Database Schema for Friends System`
- Depends on: `frontend: Build Friends Management UI`
- Related to: `frontend: Implement Privacy Settings UI`

