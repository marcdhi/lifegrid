# UI Improvements — Cursor-like Design System

This document outlines the comprehensive UI/UX improvements made to Lifegrid to achieve a high-quality, Cursor-like design philosophy.

## Design Philosophy

The redesign follows these core principles:

- **Tool-first, content-forward** — UI stays quiet, content is primary
- **Near-black dark theme** — Never pure black (#0D0D0D background)
- **No heavy borders** — Separation via spacing and surface contrast
- **Flat surfaces** — No gradients, glows, or flashy shadows
- **Soft, controlled contrast** — Easy on the eyes for long usage
- **Minimal color** — Color only communicates state or intent
- **NO ALL CAPS** — Clean, readable typography throughout
- **Large rounded corners** — Soft, cohesive feel (lg/xl radius)

---

## Color System

Updated `globals.css` with a proper Cursor-like palette:

### Backgrounds
- `--background: #0D0D0D` — Near-black base
- `--card: #151515` — Subtle surface elevation
- `--input: #1A1A1A` — Input fields

### Text Hierarchy
- `--primary: #E8E8E8` — Primary text (soft off-white)
- `--secondary: #9B9B9B` — Secondary text
- `--muted: #6B6B6B` — Tertiary/muted text

### Interaction
- Borders: `rgba(255, 255, 255, 0.06)` — Minimal contrast
- Hover: `rgba(255, 255, 255, 0.03)` — Subtle highlight
- Focus ring: `rgba(255, 255, 255, 0.12)` — Soft, not jarring

### Radius Scale
- sm: `0.5rem` (8px)
- md: `0.75rem` (12px)
- lg: `1rem` (16px)
- xl: `1.25rem` (20px)

---

## New Component System

Created a comprehensive, reusable component library in `components/ui/`:

### Layout Components

#### `<PageHeader />`
- Consistent page-level header
- Supports title, subtitle, and actions
- Used in Year and Spending pages

#### `<DateHeader />`
- Specialized date navigation header
- Large date display with navigation controls
- Used in Today and Fitness pages

#### `<SectionHeader />`
- Consistent section titles
- Optional action slot
- Replaces all-caps section labels

### Form Components

#### `<TextField />`
- Standard text input with label
- Clean rounded design
- Background surface for visibility
- No border-bottom pattern

#### `<TextareaField />`
- Multi-line text input
- Consistent with TextField styling
- Used for highlights and notes

#### `<DatePicker />`
- Native date input with proper styling
- Dark color scheme support
- Used in Spending page

#### `<TimePicker />`
- Native time input with proper styling
- Used in Fitness food logging

#### `<TagInput />`
- Advanced tag input with autocomplete
- Comma or Enter to add tags
- Backspace to remove
- Suggestion dropdown
- Used in Fitness food logging

### Interactive Components

#### `<IconButton />`
- Consistent icon button styling
- Variants: default, destructive
- Sizes: sm, md, lg
- Replaces one-off button implementations

#### `<Card />`
- Reusable card container
- Variants: default, interactive
- Large rounded corners
- Subtle border

### Empty States

#### `<EmptyState />`
- Consistent empty state messaging
- Optional icon, description, action
- Used across Fitness, Spending

---

## Page-by-Page Changes

### Today Page (`/today`)
- ✅ Replaced header with `<DateHeader />`
- ✅ Replaced highlights/notes with `<TextareaField />`
- ✅ Removed ALL CAPS labels
- ✅ Updated Hour Grid with larger rounded corners
- ✅ Improved category picker UI
- ✅ Better spacing and visual hierarchy

### Year Page (`/year`)
- ✅ Replaced header with `<PageHeader />`
- ✅ Removed ALL CAPS from month labels
- ✅ Changed "JAN" → "Jan" for better readability
- ✅ Improved barcode tile styling (rounded corners)
- ✅ Better spacing between month rows
- ✅ Cleaner legend presentation

### Fitness Page (`/fitness`)
- ✅ Replaced header with `<DateHeader />`
- ✅ Removed ALL CAPS from all labels
- ✅ Integrated `<TagInput />` for food logging
- ✅ Integrated `<TimePicker />` for time selection
- ✅ Used `<Card />` for workout exercises
- ✅ Improved onboarding flow UI
- ✅ Better empty states
- ✅ Cleaner weekly overview
- ✅ Removed focus outlines, improved hover states

### Spending Page (`/spending`)
- ✅ Replaced header with `<PageHeader />`
- ✅ Integrated `<DatePicker />` for proper date selection
- ✅ Added category autocomplete with suggestions
- ✅ Categories reuse existing entries automatically
- ✅ Removed ALL CAPS from labels
- ✅ Used `<TextField />` throughout
- ✅ Better empty states
- ✅ Improved category breakdown bars

### Sidebar
- ✅ Larger rounded corners on nav items
- ✅ Better hover states
- ✅ Consistent spacing
- ✅ Uses CSS variables properly

---

## Typography Guidelines

### No All Caps
❌ Before: `<label className="text-[10px] uppercase tracking-wider text-muted">`
✅ After: `<label className="text-[11px] tracking-wide text-muted font-medium">`

### Hierarchy
- Page titles: 48-60px, light weight
- Section headers: 11px, medium weight, wide tracking
- Body text: 12-14px, normal weight
- Captions/meta: 10-11px, muted color

### Mono Fonts
- Used for: time, dates, numbers
- Class: `font-mono tabular-nums`

---

## Interaction Patterns

### Focus States
- NO visible outlines by default
- Subtle background change on focus
- Ring only for accessibility when needed

### Hover States
- Text: muted → secondary
- Backgrounds: transparent → white/[0.03]
- Smooth transitions (150-200ms)

### Buttons
- Large rounded corners (lg/xl)
- No uppercase text
- Subtle hover states
- Disabled state: 50% opacity

### Forms
- Visible background on inputs
- No border-bottom patterns
- Autocomplete with clean dropdowns
- Clear visual feedback

---

## Component Discipline

Every UI element is now a reusable component:
- Headers
- Inputs
- Buttons
- Cards
- Empty states
- Date/time pickers
- Tag inputs

This ensures:
- Consistency across the app
- Easy maintenance
- Scalability
- Professional feel

---

## Database Considerations

### Spending Categories
Categories are now **user-generated and reusable**:
- No predefined list
- Autocomplete suggests existing categories
- Creates new categories on-the-fly
- Important for future analytics

This matches the food tag behavior in Fitness.

---

## Key Improvements Summary

1. **Comprehensive component system** — 10+ reusable components
2. **Consistent color palette** — Cursor-like near-black theme
3. **NO ALL CAPS anywhere** — Readable, professional typography
4. **Large rounded corners** — Soft, cohesive feel everywhere
5. **Better form UX** — Date pickers, time pickers, tag input with autocomplete
6. **Empty states** — Proper messaging when no data exists
7. **Improved spacing** — Better visual hierarchy throughout
8. **Hover/focus refinement** — Subtle, intentional interactions
9. **Category autocomplete** — Spending and Food both support smart suggestions
10. **Componentization** — Every UI element is now a reusable component

---

## Migration Notes

### For Future Development

When adding new UI:
1. Always use existing components from `components/ui/`
2. Follow the established color system
3. Never use ALL CAPS for text
4. Use large rounded corners (lg/xl)
5. Keep interactions subtle
6. Maintain consistent spacing

### Component Usage

```tsx
// Headers
<PageHeader title="Title" subtitle="Subtitle" actions={<IconButton />} />
<DateHeader date={date} onPrevious={prev} onNext={next} onToday={today} />
<SectionHeader action={<IconButton />}>Section Title</SectionHeader>

// Forms
<TextField label="Label" value={val} onChange={onChange} />
<TextareaField label="Label" value={val} onChange={onChange} rows={2} />
<DatePicker label="Date" value={val} onChange={onChange} />
<TimePicker label="Time" value={val} onChange={onChange} />
<TagInput label="Tags" tags={tags} onTagsChange={setTags} suggestions={suggestions} />

// Interactive
<IconButton variant="default" size="md" onClick={handler}>
  <Icon />
</IconButton>
<Card variant="interactive">{content}</Card>

// Empty States
<EmptyState title="No data" description="Optional description" />
```

---

## Result

The app now has a **calm, intentional, premium feel** suitable for daily, long-term use. It's built on a strong design system that feels consistent, high-quality, and extremely Cursor-like.

