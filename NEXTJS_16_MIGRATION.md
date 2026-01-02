# Next.js 16 Migration Note

## ⚠️ Breaking Change Fixed

Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`.

### What Changed

**Before (Next.js 15):**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Auth routing logic
}
```

**After (Next.js 16):**
```typescript
// proxy.ts
export async function proxy(request: NextRequest) {
  // Auth routing logic + session management
}

export const config = {
  matcher: [/* routes to match */]
}
```

### Critical Requirement

The function **must** be named `proxy` (not `updateSession` or `middleware`).

Next.js 16 requires either:
- A named export called `proxy`, OR
- A default export function

We use the named export: `export async function proxy(request: NextRequest)`

### Files Updated

- ✅ **Deleted:** `middleware.ts`
- ✅ **Updated:** `proxy.ts` (merged auth routing logic)
- ✅ **Updated:** Documentation (README, IMPLEMENTATION, HANDOFF)

### How It Works Now

The `proxy.ts` file now handles:
1. Supabase session management (cookie handling)
2. User authentication check
3. Route protection (redirect logic)

**Public routes:** `/auth`
**Protected routes:** Everything else

Unauthenticated users → Redirected to `/auth`
Authenticated users on `/auth` → Redirected to `/today`

### No Action Required

This change is **already implemented**. The app will work correctly with Next.js 16.

---

**Reference:** https://nextjs.org/docs/messages/middleware-to-proxy

