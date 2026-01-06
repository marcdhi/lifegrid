# frontend: Increase Font Sizes and Improve Typography Scale

**Type:** Frontend / Accessibility / UX  
**Priority:** High

## Problem

Users report that fonts are too small throughout the app, making it difficult to read and follow along, especially on mobile devices. While the minimal design is appreciated, readability is suffering.

## Current State

The app uses very small font sizes:
- `text-xs` (0.75rem / 12px) for many UI elements
- `text-sm` (0.875rem / 14px) for body text
- `text-[10px]` for some labels
- Small tracking and tight line heights

## Solution

Implement a more readable typography scale:
1. Increase base font sizes across the board
2. Improve line heights for better readability
3. Adjust spacing to accommodate larger text
4. Ensure mobile-first responsive sizing
5. Maintain visual hierarchy while improving legibility

## UX Considerations

- Balance minimalism with readability
- Ensure text doesn't feel cramped
- Maintain the app's aesthetic while improving usability
- Consider different font sizes for mobile vs desktop if needed
- Test with users who have vision difficulties

## Acceptance Criteria

- [ ] Base font sizes are increased (minimum 14px for body text)
- [ ] All text is easily readable on mobile devices
- [ ] Line heights provide adequate breathing room
- [ ] Visual hierarchy is maintained with larger fonts
- [ ] Spacing is adjusted to accommodate larger text
- [ ] The app still feels minimal and clean
- [ ] Text is readable without zooming on mobile

## Implementation Ideas

- Update Tailwind config or CSS variables for typography scale
- Change `text-xs` to `text-sm` or `text-base` where appropriate
- Increase line-height values (currently 1.6, consider 1.7-1.8)
- Review and update all text size classes across components
- Consider adding a responsive font size system
- Test on various screen sizes and devices

## Files to Modify

- `app/globals.css` - Typography base styles
- All component files - Update text size classes
- Consider creating a typography utility or design tokens

## Typography Scale Proposal

- Body text: `text-base` (16px) instead of `text-sm` (14px)
- Small text: `text-sm` (14px) instead of `text-xs` (12px)
- Labels: `text-sm` (14px) minimum
- Headers: Increase proportionally
- Line height: 1.7-1.8 for better readability

## Related Issues

- Related to: `frontend: General UI UX Improvements and Bug Fixes` (part of overall UX improvements)

