# frontend: Improve Add Entry Button Styling Across the App

**Type:** Frontend / UI/UX  
**Priority:** Medium

## Problem

The "Add entry" buttons across the app look like plain text and don't read as actionable buttons. This reduces discoverability and makes it unclear what actions users can take.

## Current State

Looking at the codebase, "Add entry" buttons are currently styled like this:
```tsx
className="text-xs tracking-wide text-secondary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
```
This makes them look like text links rather than actionable buttons.

## Solution

Convert all "Add entry" buttons to use the proper Button component with appropriate styling:
1. Use the existing `Button` component from `components/ui/button.tsx`
2. Apply consistent styling with proper padding, borders, and background
3. Ensure disabled states are visually clear
4. Maintain the minimal aesthetic while improving affordance

## UX Considerations

- Buttons should be clearly clickable with proper visual hierarchy
- Maintain the app's minimal design language
- Ensure buttons work well on both mobile and desktop
- Disabled state should be obvious but not jarring

## Acceptance Criteria

- [ ] All "Add entry" buttons use the Button component
- [ ] Buttons have proper padding and visual weight
- [ ] Buttons are clearly distinguishable from text
- [ ] Hover states provide clear feedback
- [ ] Disabled states are visually distinct
- [ ] Buttons maintain consistent styling across pages
- [ ] Mobile touch targets are adequate (min 44x44px)

## Implementation Ideas

- Replace plain `<button>` elements with `<Button>` component
- Use `variant="outline"` or `variant="secondary"` for consistency
- Consider adding an icon (Plus) for better visual communication
- Ensure proper spacing and alignment in forms

## Files to Modify

- `app/(app)/fitness/page.tsx` - Line 601-607 (Food form submit button)
- `app/(app)/spending/page.tsx` - Line 317-323 (Spending form submit button)
- Check for any other "Add entry" buttons across the app

## Related Issues

- Related to: `frontend: Fix Mobile Keyboard Input for TagInput Component` (both affect form usability)

