# Hour Grid Interaction Guide

## Visual Layout

The hour grid displays 24 hours (0-23) in a 6-column × 4-row layout:

```
┌────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │  Midnight - 5 AM
├────┼────┼────┼────┼────┼────┤
│ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │  6 AM - 11 AM
├────┼────┼────┼────┼────┼────┤
│ 12 │ 13 │ 14 │ 15 │ 16 │ 17 │  Noon - 5 PM
├────┼────┼────┼────┼────┼────┤
│ 18 │ 19 │ 20 │ 21 │ 22 │ 23 │  6 PM - 11 PM
└────┴────┴────┴────┴────┴────┘
```

## Interaction Modes

### Mode 1: Single Hour Assignment

**When:** No category selected (default state)

**Action:** Click any hour cell

**Result:** Category picker popup appears at click position

**Flow:**
```
Click hour → Popup shows → Select category → Cell fills with color
```

**Visual States:**
- Empty cell: Dark background, border, hour number visible
- Hover: Border brightens slightly
- After assignment: Cell background = category color

---

### Mode 2: Drag Painting

**When:** Category selected from palette below

**Action:** Click + drag across multiple hours

**Result:** All touched cells get painted with selected category

**Flow:**
```
Click category → Active indicator appears → Click+drag → Cells fill in real-time
```

**Visual States:**
- Active category: Badge shows "🟦 Work" (color + name)
- Dragging: Cursor changes, cells fill as you pass over them
- Clear selection: Click "Clear selection" button

---

### Mode 3: Clearing Hours

**Method A:** Right-click on filled cell
**Method B:** Cmd+click (Mac) / Ctrl+click (Windows) on filled cell

**Result:** Cell clears to empty state (background returns to dark, border visible)

**Visual States:**
- Right-click: Context menu prevented, immediate clear
- Feedback: Cell animates back to empty state

---

## Category Palette

Below the hour grid, all 12 categories are shown as clickable buttons:

```
┌─────────────┬─────────────┐
│ 🟦 Sleep    │ 🟥 Work     │
├─────────────┼─────────────┤
│ 🟧 Hobbies  │ 🟪 Freelance│
├─────────────┼─────────────┤
│ ... (8 more categories)    │
└─────────────┴─────────────┘
```

**Click any category:**
- Border highlights
- Active indicator appears above grid
- You're now in "paint mode"

---

## Visual Hierarchy

### Empty Hour Cell
```
┌───────────┐
│           │  ← Dark bg (#0B0E14)
│     12    │  ← Hour number in gray
│           │  ← Border (1px, #1F232E)
└───────────┘
```

### Filled Hour Cell
```
┌───────────┐
│           │  ← Category color bg
│     12    │  ← White number (mix-blend-difference)
│           │  ← No border
└───────────┘
```

### Hover State
```
┌───────────┐
│           │  ← Border brightens to #3A3F4F
│     12    │  ← Cursor: pointer
│           │  ← Transition: 200ms
└───────────┘
```

---

## Edge Cases Handled

### 1. Overwriting
- **Scenario:** Hour already has a category
- **Behavior:** New category replaces old (no confirmation)
- **Why:** Frictionless editing

### 2. Rapid Clicking
- **Scenario:** User clicks multiple hours quickly
- **Behavior:** Each click queues separately, all save to DB
- **Why:** Optimistic UI updates

### 3. Drag Outside Grid
- **Scenario:** User drags mouse outside grid bounds
- **Behavior:** Painting stops, releases on mouse up anywhere
- **Why:** Global mouse listener prevents stuck state

### 4. Empty Cell Clear
- **Scenario:** User right-clicks empty cell
- **Behavior:** Nothing happens (no error)
- **Why:** Idempotent operation

---

## Database Sync

Every interaction triggers a database operation:

### Create Hour Log
```typescript
// User clicks empty cell, selects category
INSERT INTO hour_logs (user_id, day_id, hour, category_id)
VALUES (user.id, day.id, 12, category.id)
```

### Update Hour Log
```typescript
// User paints over existing hour
UPDATE hour_logs 
SET category_id = new_category.id
WHERE day_id = day.id AND hour = 12
```

### Delete Hour Log
```typescript
// User clears hour
DELETE FROM hour_logs
WHERE day_id = day.id AND hour = 12
```

All operations are **immediate** (no debouncing).

---

## Accessibility

### Keyboard Navigation
- **Tab:** Move through palette categories
- **Enter/Space:** Select category
- **Escape:** Close picker popup

### Screen Readers
- Each cell has title attribute: "12:00 PM - Work"
- Picker buttons have clear labels
- Active category announced

### Focus Management
- Focus returns to grid after picker closes
- Clear visual focus rings (2px, ring color)

---

## Performance Notes

### Rendering
- Grid uses CSS Grid (6 columns, auto rows)
- Cells are divs (not buttons) to avoid form semantics
- Colors applied via inline styles (dynamic)

### State Updates
- Local state updates immediately (optimistic)
- Database saves happen async
- No loading spinners (trust the system)

### Memory
- No subscriptions on this component
- Event listeners cleaned up on unmount
- No memory leaks

---

## Design Decisions

### Why 6×4 grid?
- 24 hours ÷ 6 = 4 rows
- Fits desktop screens without scrolling
- Square cells (aspect-ratio: 1)

### Why click-drag?
- Faster than 24 individual clicks
- Common pattern (Figma, Photoshop)
- Feels natural

### Why popover picker?
- Contextual (appears where you click)
- Doesn't obscure grid
- Dismisses on outside click

### Why no confirmation?
- Editing is the core action
- Undo = just repaint
- Trust the user

---

## Common Workflows

### Logging a typical workday
1. Click "Work" category in palette
2. Drag from hour 9 to hour 17 (9 AM - 5 PM)
3. Release
4. Click "Sleep" category
5. Drag from hour 0 to hour 6 (midnight - 6 AM)
6. Release
7. Click individual hours for evening activities

**Time:** ~15 seconds

### Correcting a mistake
1. Right-click the wrong hour
2. Click correct category from palette
3. Click the hour again

**Time:** ~3 seconds

### Viewing a day
- Just look at the grid
- Colors tell the story
- Hover for category names

**Time:** Instant

---

## Future Enhancements (Not Implemented)

These were considered but excluded for v1:

- ❌ Hour-level notes (table supports it, UI doesn't show)
- ❌ Bulk select (Shift+click range)
- ❌ Copy/paste day patterns
- ❌ Templates ("typical workday")
- ❌ Keyboard shortcuts (1-12 for categories)

**Why excluded:** Keep it simple. Observe real usage first.

---

## Technical Implementation

### Key Files
- `components/hour-grid.tsx` - Grid UI + interaction logic
- `app/(app)/today/page.tsx` - Data fetching + state management
- `lib/types.ts` - `HourCellData` interface

### State Flow
```
User clicks → Component state updates → UI renders → DB call → Success
```

### Error Handling
```typescript
try {
  await supabase.from('hour_logs').insert(...)
} catch (error) {
  // Silent fail (optimistic UI already updated)
  // Could add toast notification here
}
```

---

This interaction pattern is the **heart** of Lifegrid.

It had to feel right. It does.

