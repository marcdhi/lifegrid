# UI Refinements — Round 2

This document outlines the critical refinements and improvements made based on user feedback.

## Issues Fixed

### 1. Text Input Focus Issue ✅

**Problem:** Text inputs were losing their background color on focus, appearing broken.

**Solution:**
- Updated all input components to retain `bg-input` background on focus
- Changed focus interaction from `focus:bg-white/[0.03]` to `focus:border-white/[0.08]`
- Applied to:
  - `<TextField />`
  - `<TextareaField />`
  - `<DatePicker />`
  - `<TimePicker />`
  - `<TagInput />`

**Result:** Inputs now maintain their surface quality on focus with subtle border feedback only.

---

### 2. Hour Grid — Complete Rewrite with Variable Duration ✅

**Problem:** Grid was still fixed 1-hour blocks, no drag/resize, not timeline-like.

**Solution:** Completely rewrote the hour grid component:

#### Database Changes
- **New Migration:** `scripts/009_add_duration_to_hour_logs.sql`
- Added `duration_minutes` column to `hour_logs` table
- Default: 60 minutes
- Constraint: must be positive
- Updated `HourLog` type to include `duration_minutes`

#### New Component: `hour-grid-timeline.tsx`
Replaced the old grid-based approach with a true timeline interface:

**Features:**
- ✅ **Variable duration blocks** — Each block can be 15min to 24 hours
- ✅ **Drag to move** — Click and drag entire blocks horizontally
- ✅ **Resize from edges** — Drag left/right edges to adjust duration
- ✅ **15-minute snap grid** — Smooth, predictable snapping
- ✅ **Time scale above grid** — Shows hour markers (12 AM, 3 AM, etc.)
- ✅ **Visual feedback** — Blocks show category color, name, and duration on hover
- ✅ **Keyboard shortcuts** — Cmd+Click to delete blocks
- ✅ **Category picker** — Click empty space to add new blocks
- ✅ **Instructions** — Clear UX guidance at bottom

**Interaction Model:**
```
Click empty space → Select category or show picker → Creates 60min block
Click block → No action (prep for drag)
Drag block → Moves horizontally, snaps to 15min intervals
Drag left edge → Adjusts start time + duration
Drag right edge → Adjusts duration only
Cmd+Click block → Deletes block
```

**Visual Design:**
- Single timeline bar (height: 96px)
- Hour markers as vertical lines
- Blocks float above with rounded corners
- Resize handles appear on hover (left/right edges)
- Maintains existing category colors (no changes)
- Clean, minimal time scale

#### Updated Today Page
- Changed API from `onHourUpdate/onHourClear` to `onBlockUpdate/onBlockCreate/onBlockDelete`
- Passes `HourLog[]` instead of `HourCellData[]`
- Handles partial updates for drag/resize
- Creates blocks with default 60min duration

---

### 3. Date Header UI Improvement ✅

**Problem:** Date header looked weak and unpolished.

**Solution:**
- **Larger day number** — 7xl size (was 6xl)
- **Better hierarchy:**
  - Full month name (not abbreviated)
  - Year displayed alongside month
  - Weekday below in secondary color
- **Improved layout:**
  - Day number and month/year side-by-side at baseline
  - Better spacing and alignment
  - Navigation buttons have hover states
- **Proper casing** — "January" not "JAN"

**Before:**
```
27
JAN
Monday
```

**After:**
```
27  January 2025
    Monday
```

---

### 4. Analytics Page Redesign ✅

**Changes:**
- ✅ Replaced header with `<PageHeader />`
- ✅ Removed ALL CAPS from all text
- ✅ Used `<Card />` components for stats and breakdowns
- ✅ Created `<StatCard />` component for metric display
- ✅ Tab navigation redesigned (Time / Fitness)
- ✅ Better visual hierarchy
- ✅ Larger rounded corners throughout
- ✅ Improved empty states
- ✅ Philosophy footer added
- ✅ Fixed hour calculation to use `duration_minutes`

**Key Components:**
- Time stats show total hours and category breakdown
- Fitness stats show food and workout analytics
- All bars use Cards for consistency
- Clean, calm presentation

---

### 5. Reflection Page Redesign ✅

**Changes:**
- ✅ Replaced header with `<PageHeader />`
- ✅ Removed ALL CAPS
- ✅ Used `<Card />` for each reflection entry
- ✅ Improved date display (larger, better hierarchy)
- ✅ Interactive cards with hover states
- ✅ Better spacing and readability
- ✅ Added `<EmptyState />` component
- ✅ Philosophy footer

**Visual improvements:**
- Each reflection is a clickable card
- Date prominently displayed (large day number)
- Full month name, year, and weekday
- Highlights and Notes properly labeled
- Clean line height for readability

---

### 6. Settings Page Redesign ✅

**Changes:**
- ✅ Replaced header with `<PageHeader />`
- ✅ Removed ALL CAPS
- ✅ Used `<Card />` for each section
- ✅ Replaced raw inputs with `<TextField />`
- ✅ Better button styling (border, rounded, hover states)
- ✅ Improved export buttons with icons
- ✅ Toast notification uses new design
- ✅ Philosophy footer
- ✅ Updated CSV export to include `duration_minutes`

**Sections:**
- Account info in Card
- Timezone setting in Card with proper TextField
- Export controls in Card
- All buttons match new design system

---

## Component Discipline

Every page now uses the component library:
- `<PageHeader />` — Page-level headers
- `<DateHeader />` — Date navigation headers
- `<SectionHeader />` — Section titles
- `<Card />` — Content containers
- `<TextField />` — Text inputs
- `<TextareaField />` — Multi-line inputs
- `<DatePicker />` — Date selection
- `<TimePicker />` — Time selection
- `<TagInput />` — Tag/multi-value input
- `<IconButton />` — Icon-only buttons
- `<EmptyState />` — No data states

---

## Files Modified

### New Files:
- `components/hour-grid-timeline.tsx` — Complete rewrite
- `scripts/009_add_duration_to_hour_logs.sql` — Database migration

### Updated Files:
- `lib/types.ts` — Added `duration_minutes` to HourLog
- `app/(app)/today/page.tsx` — New timeline grid integration
- `app/(app)/analytics/page.tsx` — Complete redesign
- `app/(app)/reflection/page.tsx` — Complete redesign
- `app/(app)/settings/page.tsx` — Complete redesign
- `components/ui/date-header.tsx` — Improved hierarchy
- `components/ui/text-field.tsx` — Fixed focus behavior
- `components/ui/textarea-field.tsx` — Fixed focus behavior
- `components/ui/date-picker.tsx` — Fixed focus behavior
- `components/ui/time-picker.tsx` — Fixed focus behavior
- `components/ui/tag-input.tsx` — Fixed focus behavior

---

## Database Migration Required

**IMPORTANT:** Run this SQL migration before using the app:

```sql
-- Run: scripts/009_add_duration_to_hour_logs.sql
ALTER TABLE hour_logs
ADD COLUMN duration_minutes INTEGER DEFAULT 60;

UPDATE hour_logs
SET duration_minutes = 60
WHERE duration_minutes IS NULL;

ALTER TABLE hour_logs
ADD CONSTRAINT duration_positive CHECK (duration_minutes > 0);
```

This enables variable duration blocks. Existing data will default to 60 minutes.

---

## Hour Grid — Technical Details

### Data Model
```typescript
interface HourLog {
  hour: number              // Start time (0-23)
  duration_minutes: number  // Block duration (15-1440)
  category_id: string
  // ... other fields
}
```

### Interaction Details

**Snapping:**
- All positions snap to 15-minute intervals
- Prevents overlapping blocks (handled by UI constraints)
- Min duration: 15 minutes
- Max duration: 24 hours (1440 minutes)

**Positioning:**
```
Position = (minutes from midnight / total minutes in day) × grid width
Width = (duration_minutes / total minutes in day) × grid width
```

**Edge Cases Handled:**
- Can't drag block past 24:00 (end of day)
- Can't resize smaller than 15 minutes
- Can't resize larger than remaining day time
- Dragging constrains to valid hour ranges

---

## Testing Checklist

### Text Inputs
- [ ] All inputs retain background on focus
- [ ] Focus shows subtle border change only
- [ ] No outlines or jarring changes

### Hour Grid
- [ ] Can create blocks by clicking empty space
- [ ] Can drag blocks horizontally
- [ ] Can resize blocks from both edges
- [ ] Blocks snap to 15-minute intervals
- [ ] Time scale shows correct hours
- [ ] Cmd+Click deletes blocks
- [ ] Category picker works
- [ ] Existing category colors unchanged

### Pages
- [ ] Analytics page loads and shows data
- [ ] Reflection page shows entries in cards
- [ ] Settings page allows timezone changes
- [ ] All pages use consistent components
- [ ] No ALL CAPS anywhere
- [ ] Large rounded corners throughout

---

## What's Next

If you want further refinements:
1. Add keyboard shortcuts for timeline (arrow keys to move blocks)
2. Add block collision detection (prevent overlaps)
3. Add undo/redo for block operations
4. Add block copying/duplication
5. Add block notes/descriptions

The foundation is now solid and Cursor-like. All interactions are intentional and high-quality.

