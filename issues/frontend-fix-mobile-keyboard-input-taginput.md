# frontend: Fix Mobile Keyboard Input for TagInput Component (Food & Fitness Pages)

**Type:** Frontend / Mobile UX  
**Priority:** High

## Problem

On mobile devices, some keyboards don't show an Enter key, making it impossible for users to create pills/tags in the TagInput component on the food logging and fitness pages. This prevents users from creating entries because the "Add entry" button remains disabled until at least one tag is added.

## Current Behavior

- TagInput component requires pressing Enter to add tags
- Mobile keyboards (especially on iOS) may show "Return" or "Done" instead of Enter
- Users cannot add tags, so the form submit button remains disabled
- The placeholder text says "Type food name and press Enter" which isn't helpful on mobile

## Solution

Add alternative input methods for mobile devices:
1. Add a visible "+" or "Add" button next to the input field
2. Support comma-separated input (already partially supported but needs better UX)
3. Add a "Done" button that appears when input has text
4. Improve mobile keyboard type hints (`inputmode`, `enterkeyhint`)

## UX Considerations

- Show a floating action button or inline button when input has text
- Make it clear that users can tap to add tags, not just press Enter
- Update placeholder text to be mobile-friendly
- Ensure the button is large enough for touch targets (min 44x44px)

## Acceptance Criteria

- [ ] Users can add tags by tapping a visible button on mobile
- [ ] Comma-separated input works smoothly
- [ ] Mobile keyboard shows appropriate action button (Done/Next)
- [ ] Placeholder text is mobile-friendly
- [ ] Touch targets meet accessibility standards (min 44x44px)
- [ ] Works on both iOS and Android devices
- [ ] Existing Enter key functionality still works on desktop

## Implementation Ideas

- Add a conditional render of an "Add" button that appears when `input.trim().length > 0`
- Use `enterkeyhint="done"` or `enterkeyhint="next"` on the input element
- Consider using `inputmode="text"` for better keyboard suggestions
- Add visual feedback when tags are added
- Update `components/ui/tag-input.tsx` to include mobile-friendly controls

## Files to Modify

- `components/ui/tag-input.tsx` - Main component logic
- `app/(app)/fitness/page.tsx` - Food form section
- Consider adding mobile-specific styles

## Related Issues

- Related to: `frontend: Improve Add Entry Button Styling` (both affect form usability)

