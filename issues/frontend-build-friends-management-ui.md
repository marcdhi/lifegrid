# frontend: Build Friends Management UI

**Type:** Frontend / Feature  
**Priority:** Medium

## Problem

Users need a way to find, add, and manage friends on the platform. This is the foundation for the social features.

## Solution

Create a Friends page with:
1. Search functionality to find users by email
2. Send friend request flow
3. View pending requests (sent and received)
4. Accept/reject friend requests
5. View list of current friends
6. Remove/unfriend functionality

## UX Considerations

- Simple, intuitive interface
- Clear status indicators (pending, accepted)
- Easy search and discovery
- Mobile-friendly design
- Clear actions for each state

## Acceptance Criteria

- [ ] New "Friends" page accessible from navigation
- [ ] Search users by email functionality
- [ ] Send friend request button/flow
- [ ] View pending requests (sent and received)
- [ ] Accept/reject friend requests
- [ ] View list of current friends
- [ ] Remove friend functionality
- [ ] Loading states and error handling
- [ ] Mobile-responsive design

## Implementation Ideas

- Create `app/(app)/friends/page.tsx`
- Add "Friends" link to sidebar navigation
- Use Supabase client to query friendships table
- Implement real-time updates for friend requests (optional)
- Add proper error handling and user feedback
- Consider adding user avatars/initials

## Files to Create/Modify

- `app/(app)/friends/page.tsx` - New friends page
- `components/sidebar.tsx` - Add Friends navigation link
- `lib/types.ts` - Add Friendship and UserPrivacySettings types
- Consider creating `components/friends-list.tsx` component

## Prerequisites

- `backend: Create Database Schema for Friends System` must be completed first

## Related Issues

- Depends on: `backend: Create Database Schema for Friends System`
- Related to: `frontend: Implement Privacy Settings UI`
- Related to: `frontend+backend: Create Leaderboard Feature`

