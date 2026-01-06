# frontend: Optimize Theme Loading and Caching

**Type:** Frontend / Performance  
**Priority:** Low

## Problem

To avoid excessive database reads, we need to optimize how themes are loaded and cached. Themes should load quickly without impacting performance.

## Solution

Implement theme caching strategy:
1. Cache themes in localStorage
2. Fetch user theme preference on app load
3. Apply theme before first render (avoid flash)
4. Consider server-side theme application
5. Cache theme definitions client-side

## Why This Matters

- Database reads on every page load would be slow
- Theme should apply immediately (no flash of wrong theme)
- Better user experience with instant theme application

## Acceptance Criteria

- [ ] Theme preference cached in localStorage
- [ ] Theme applies before first render
- [ ] Minimal database queries for themes
- [ ] Theme definitions cached client-side
- [ ] Smooth theme transitions
- [ ] No flash of incorrect theme on page load

## Implementation Ideas

- Create theme context/provider that manages theme state
- Use localStorage to cache user's theme preference
- Fetch theme definitions once and cache them
- Apply theme via CSS variables in a useEffect
- Consider using Next.js middleware or getServerSideProps for SSR
- Add theme loading state to prevent flash

## Files to Create/Modify

- `lib/theme-context.tsx` or `contexts/theme-context.tsx` - Theme context
- `app/layout.tsx` - Apply theme on initial load
- Consider creating `lib/theme-utils.ts` for theme utilities

## Prerequisites

- `backend: Create Theme System Database Schema` must be completed first
- `frontend: Implement Theme Selection UI` should be completed

## Related Issues

- Depends on: `backend: Create Theme System Database Schema`
- Depends on: `frontend: Implement Theme Selection UI`

