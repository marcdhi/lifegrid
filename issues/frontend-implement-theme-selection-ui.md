# frontend: Implement Theme Selection UI

**Type:** Frontend / Feature  
**Priority:** Medium

## Problem

Users need a way to select and preview themes in the Settings page. The selected theme should apply across the entire app.

## Solution

Add theme selection to Settings:
1. Theme picker with preview cards
2. Visual preview of each theme
3. Apply theme on selection
4. Persist theme preference to database
5. Apply theme CSS variables dynamically

## UX Considerations

- Visual theme previews (color swatches)
- Easy to see current selection
- Smooth theme transitions
- Preview before applying
- Clear theme names and descriptions

## Acceptance Criteria

- [ ] Theme selection section in Settings page
- [ ] Visual preview cards for each theme
- [ ] Current theme is clearly indicated
- [ ] Theme applies immediately on selection
- [ ] Theme preference saves to database
- [ ] Theme persists across page reloads
- [ ] Smooth transitions between themes
- [ ] Mobile-responsive theme picker

## Implementation Ideas

- Add theme section to `app/(app)/settings/page.tsx`
- Create `components/theme-picker.tsx` component
- Use CSS variables that can be updated dynamically
- Fetch themes from database on page load
- Update user theme preference via Supabase
- Apply theme by updating root CSS variables
- Consider adding theme preview modal

## Files to Create/Modify

- `app/(app)/settings/page.tsx` - Add theme selection section
- `components/theme-picker.tsx` - New theme picker component
- `app/layout.tsx` - May need to fetch and apply theme on load
- `lib/types.ts` - Add Theme and UserTheme types
- Consider creating a theme context/provider

## Technical Considerations

- Apply theme via CSS custom properties (CSS variables)
- Update `:root` styles dynamically based on selected theme
- Cache theme preference in localStorage for faster initial load
- Consider SSR/SSG implications for theme application

## Prerequisites

- `backend: Create Theme System Database Schema` must be completed first

## Related Issues

- Depends on: `backend: Create Theme System Database Schema`
- Related to: `frontend: Optimize Theme Loading and Caching`

