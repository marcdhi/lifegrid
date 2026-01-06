# frontend: Implement Privacy Settings UI

**Type:** Frontend / Feature  
**Priority:** Medium

## Problem

Users need to control what data they share with friends. They should be able to toggle privacy settings for different data types.

## Solution

Add privacy settings section to Settings page:
1. Toggle switches for each data type (fitness, analytics, schedule, grid)
2. Clear labels explaining what each setting does
3. Visual feedback when settings are saved
4. Default to private (all off)

## UX Considerations

- Clear, simple toggles
- Explanatory text for each setting
- Group related settings together
- Immediate save feedback
- Consider adding a preview of what friends can see

## Acceptance Criteria

- [ ] Privacy settings section added to Settings page
- [ ] Toggle switches for each data type
- [ ] Settings save to database immediately
- [ ] Clear labels and descriptions for each setting
- [ ] Visual feedback on save
- [ ] Default state is private (all off)
- [ ] Mobile-responsive layout

## Implementation Ideas

- Add privacy section to `app/(app)/settings/page.tsx`
- Use checkbox or toggle component for switches
- Fetch user privacy settings on page load
- Update settings via Supabase client
- Add loading states and error handling
- Consider using a Card component for visual grouping

## Files to Modify

- `app/(app)/settings/page.tsx` - Add privacy settings section
- `components/ui/checkbox.tsx` - May need to enhance or create toggle component
- `lib/types.ts` - Ensure UserPrivacySettings type is available

## Prerequisites

- `backend: Create Database Schema for Friends System` must be completed first

## Related Issues

- Depends on: `backend: Create Database Schema for Friends System`
- Related to: `frontend: Build Friends Management UI`
- Related to: `frontend+backend: Create Leaderboard Feature`

