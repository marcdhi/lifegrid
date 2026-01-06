# frontend: Implement Friend Schedule Grid View Feature

**Type:** Frontend / Feature  
**Priority:** Low (Needs Discussion)

## Problem

Users want to see their friends' schedules/grids if the friend makes them public. This allows for social accountability and inspiration.

## Solution

Create a feature to view friends' public schedules:
1. Add "View Friend's Schedule" option on Friends page
2. Display friend's hour grid for selected date
3. Respect privacy settings (only show if grid_public = true)
4. Clear indication that this is a friend's data, not your own

## UX Considerations

- Clear indication this is a friend's view
- Date picker to view different days
- Read-only view (no editing)
- Easy navigation back to own schedule
- Consider adding friend's name/avatar in header

## Acceptance Criteria

- [ ] Can view friend's schedule from Friends page
- [ ] Only shows if friend has grid_public enabled
- [ ] Read-only view (no editing capabilities)
- [ ] Date navigation works
- [ ] Clear visual distinction from own schedule
- [ ] Mobile-responsive design
- [ ] Proper loading and error states

## Implementation Ideas

- Add "View Schedule" button on friend cards in Friends page
- Create `app/(app)/friends/[friendId]/schedule/page.tsx` route
- Reuse HourGrid components but in read-only mode
- Add friend context/header to distinguish from own view
- Consider adding a "Compare with my schedule" feature

## Files to Create/Modify

- `app/(app)/friends/[friendId]/schedule/page.tsx` - Friend schedule view
- `components/hour-grid.tsx` - May need read-only variant
- `components/hour-grid-mobile.tsx` - May need read-only variant
- `app/(app)/friends/page.tsx` - Add "View Schedule" buttons

## Prerequisites

- `backend: Create Database Schema for Friends System` must be completed first
- `frontend: Build Friends Management UI` should be completed

## Note

This feature needs discussion about whether to show entire schedule or just specific days, and what level of detail to show.

## Related Issues

- Depends on: `backend: Create Database Schema for Friends System`
- Depends on: `frontend: Build Friends Management UI`
- Related to: `frontend: Implement Privacy Settings UI`

