# AI Coding Agent Instructions

You are a coding assistant working on **Lifegrid**, a life logging application built with Next.js 16, TypeScript, Supabase, and Tailwind CSS.

## Critical Rules

### ❌ DO NOT CREATE:
- **NO README files** (unless explicitly requested)
- **NO markdown documentation files** (unless explicitly requested)
- **NO comment-only files**
- **NO empty placeholder files**
- **NO "TODO" or "FIXME" comment files**

### ✅ DO CREATE:
- **ONLY CODE FILES** (.tsx, .ts, .sql, .css, etc.)
- **Functional, working code**
- **Proper TypeScript types**
- **Clean, maintainable code**

## Project Context

**Tech Stack:**
- Next.js 16 (App Router)
- TypeScript
- Supabase (PostgreSQL, Auth)
- Tailwind CSS
- shadcn/ui components
- React 19

**Project Structure:**
- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utilities, types, Supabase clients
- `scripts/` - SQL migration scripts
- `issues/` - Issue descriptions (reference only, don't modify)

**Design Philosophy:**
- Minimal, calm interface
- Dark mode first
- Typography-focused
- Color as meaning, not decoration
- No gamification or social pressure

## When Working on Issues

1. **Read the issue file** from `issues/` folder first
2. **Understand the problem** and solution approach
3. **Check dependencies** - ensure prerequisites are met
4. **Write code only** - implement the solution
5. **Follow existing patterns** - match the codebase style
6. **Test your changes** - ensure functionality works

## Coding Standards

### TypeScript
- Use proper types from `lib/types.ts`
- Avoid `any` types
- Use interfaces for object shapes
- Export types when needed

### React Components
- Use "use client" directive for client components
- Follow existing component patterns
- Use existing UI components from `components/ui/`
- Keep components focused and single-purpose

### Styling
- Use Tailwind CSS classes
- Follow existing color scheme (CSS variables in `globals.css`)
- Maintain consistent spacing and sizing
- Mobile-first responsive design
- Touch targets minimum 44x44px

### Database (Supabase)
- Follow existing RLS policy patterns
- Use proper indexes for queries
- Include `created_at` and `updated_at` timestamps
- Use UUIDs for primary keys
- Follow migration script naming: `017_`, `018_`, etc.

### File Naming
- Components: `kebab-case.tsx` (e.g., `tag-input.tsx`)
- Pages: `page.tsx` in route folders
- Types: `types.ts`
- Utils: `utils.ts` or descriptive names

## Code Quality Checklist

Before submitting code, ensure:
- [ ] Code compiles without TypeScript errors
- [ ] Follows existing code patterns
- [ ] Uses existing UI components where possible
- [ ] Proper error handling
- [ ] Loading states where needed
- [ ] Mobile-responsive
- [ ] Accessible (proper labels, ARIA where needed)
- [ ] No console.logs or debug code
- [ ] Proper TypeScript types
- [ ] Consistent formatting

## Common Patterns

### Supabase Queries
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)### Client Component Pattern
"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"### Form Handling
- Use controlled components with useState
- Handle form submission with preventDefault
- Show loading states during submission
- Clear form on success

### Error Handling
- Always check for errors from Supabase
- Show user-friendly error messages
- Handle edge cases (empty data, null values)

## What to Do When Given a Task

1. **Read the issue file** in `issues/` folder
2. **Understand the requirements** and acceptance criteria
3. **Check existing code** to understand patterns
4. **Write the code** - implement the solution
5. **Test the implementation** - ensure it works
6. **Submit only code files** - no documentation

## Example Task Flow

**Given:** "Work on issue: frontend-fix-mobile-keyboard-input-taginput.md"

**You should:**
1. Read `issues/frontend-fix-mobile-keyboard-input-taginput.md`
2. Understand the problem (mobile keyboard doesn't show Enter key)
3. Check `components/ui/tag-input.tsx` to see current implementation
4. Modify `tag-input.tsx` to add mobile-friendly button
5. Test that it works on mobile
6. **DO NOT** create any README or markdown files

## Remember

- **Code only** - no documentation files
- **Working code** - implement fully, don't leave TODOs
- **Follow patterns** - match existing codebase style
- **Test thoroughly** - ensure functionality works
- **Be thorough** - complete the implementation

## Questions?

If you need clarification:
- Check existing code for patterns
- Look at similar features in the codebase
- Reference the issue file for requirements
- Ask for clarification if truly stuck

---

**Bottom line: Write code. Make it work. Don't create documentation files.**