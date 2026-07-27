---
name: Chess App Auth
description: JWT auth setup and admin guard for the chess game app
---

- JWT signed with SESSION_SECRET env var (fallback: hardcoded string)
- Admin email hardcoded to "grejamarak@gmail.com" in `artifacts/api-server/src/lib/auth.ts`
- `requireAuth` middleware reads Bearer token from Authorization header
- `requireAdmin` calls `requireAuth` then checks `isAdminEmail(req.user.email)` — returns 403 if not admin
- Token stored in localStorage as 'chess_token' on the frontend
- api-client-react custom-fetch.ts injects Authorization header from localStorage

**Why:** Server-side admin check on every admin route; no client-side bypass possible.
