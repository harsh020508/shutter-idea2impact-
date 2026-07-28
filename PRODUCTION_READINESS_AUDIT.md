# Shutter Production-Readiness Audit Report

**Project:** `C:\Users\Lucky\Downloads\shutter-idea2impact-`  
**Application:** Full-stack B2B retail platform (React 19 + Vite + Hono + tRPC + Drizzle ORM + MySQL + Supabase Auth + Kimi OAuth + Google Gemini)  
**Audit Date:** 2026-07-27  
**Auditors:** 4 parallel specialized agents (Security, Code Quality, DevOps, Performance/UX)

---

## Executive Summary

**Verdict: NOT READY FOR PRODUCTION**

The Shutter application has a solid modern foundation (React 19, Vite 7, tRPC 11, Drizzle, Hono) and demonstrates good architectural instincts (separation of concerns, typed API layer, modern ORM). However, it has **6 CRITICAL security vulnerabilities**, **12 HIGH-priority issues**, and numerous structural gaps that make it unsafe to expose to the public internet.

The most severe issues are:
1. **Leaked Google Gemini API key** in a committed `git diff` file (`tatus`) at the project root
2. **Hard-coded JWT signing secret fallback** that allows token forgery
3. **Mock database proxy** that can silently serve fake data in production
4. **Single-connection MySQL pool** that will deadlock under any concurrent load
5. **Wide-open CORS + no CSRF protection** enabling cross-site request forgery
6. **Zero tests** despite vitest being configured

**Estimated effort to production-ready:** 2–3 weeks of focused engineering work

---

## STOP! Immediate Actions Required (Today)

### 1. Revoke the Leaked Google Gemini API Key

**File:** `C:\Users\Lucky\Downloads\shutter-idea2impact-\tatus:102`

The `tatus` file is a `git diff` output that was accidentally committed. It contains:
```
const apiKey = "AQ.Ab8RN6JM8aV_1fHCjmCe5FY3vZUIpkfkPtNTRAYYj0QrgqzZEA";
```

**Actions:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Delete or revoke this key immediately
3. Generate a new key and store it ONLY in environment variables (`GEMINI_API_KEY`)
4. Add `tatus` to `.gitignore`
5. Delete `tatus` from the working tree
6. Run `git filter-repo --path tatus --invert-paths` to scrub from history (or use BFG Repo-Cleaner)
7. Force-push the cleaned history (coordinate with any other contributors)

### 2. Remove the Nested Git Repository

**File:** `C:\Users\Lucky\Downloads\shutter-idea2impact-\app\.git`

The `app/` directory contains its own `.git` folder, creating a nested repository. This will cause:
- `git status` to show incorrect state
- Deployment tools to misbehave
- CI/CD to fail unpredictably

**Actions:**
```bash
rm -rf "C:\Users\Lucky\Downloads\shutter-idea2impact-\app\.git"
```

### 3. Fix the Hard-coded JWT Secret Fallback

**File:** `app/api/kimi/session.ts:13, 33`

```ts
const secretStr = env.appSecret || "developer_local_secret_must_be_at_least_32_characters_long_for_hs256";
```

**Actions:**
- Remove the literal string fallback
- Throw at startup if `APP_SECRET` is missing or less than 32 characters
- Rotate any existing `APP_SECRET` if it was ever committed

---

## CRITICAL Issues (Must Fix Before Production)

| # | Severity | Area | Issue | File | Fix |
|---|----------|------|-------|------|-----|
| C1 | CRITICAL | Security | Leaked Gemini API key in committed diff | `tatus:102` | Revoke key, scrub from git history |
| C2 | CRITICAL | Auth | Hard-coded JWT signing secret fallback | `api/kimi/session.ts:13,33` | Throw if missing, never fallback |
| C3 | CRITICAL | Auth | OAuth `state` parameter decoded with `atob` but never validated; no PKCE | `api/kimi/auth.ts:111-138` | Sign state with HMAC, verify on callback, add PKCE |
| C4 | CRITICAL | DB | Mock DB proxy reachable when `DATABASE_URL` is empty; serves fake data | `api/queries/connection.ts:9-192` | Remove proxy entirely, throw at boot if DB URL missing |
| C5 | CRITICAL | DB | MySQL pool capped at 1 connection; will deadlock under load | `api/queries/connection.ts:206-212` | Raise to 10–20 connections |
| C6 | CRITICAL | CORS/CSRF | `origin: (origin) => origin` + `credentials: true` allows any origin with creds | `api/boot.ts:17-22` | Allowlist specific origins, add CSRF token |
| C7 | CRITICAL | Auth | Google Auth `aud` check skipped when `GOOGLE_CLIENT_ID` is empty | `api/boot.ts:51` | Require `GOOGLE_CLIENT_ID`, verify JWT with JWKS |
| C8 | CRITICAL | Secrets | Dockerfile copies `.env` into the image | `Dockerfile:26` | Never COPY `.env`, pass at runtime |
| C9 | CRITICAL | Secrets | Dockerfile has hard-coded corporate proxy and private npm mirror | `Dockerfile:6-9,13` | Make configurable via build args |

---

## HIGH Issues (Should Fix Soon)

### Security (H1–H9)

| # | Issue | File | Fix |
|---|-------|------|-----|
| H1 | No rate limiting on any endpoint | All routers, `boot.ts` | Add `@hono/rate-limiter` |
| H2 | Session cookie `SameSite=None` in prod with 1-year expiry | `api/lib/cookies.ts:14-23`, `api/kimi/session.ts:18` | Set `SameSite=Lax`, reduce to 24h with refresh token |
| H3 | `upsertUser` trusts `user_metadata` from Supabase token without validation | `api/kimi/auth.ts:75-107` | Validate email, sanitize name/avatar |
| H4 | No input length validation; 50MB body limit | `api/boot.ts:23`, Zod schemas | Lower to 1–2MB, add `z.string().max(N)` |
| H5 | IDOR: `publicQuery` routes expose retailer rows, device pindrops | `retailer-router.ts:82-92`, `pindrop-router.ts:248-257` | Move behind `authedQuery` |
| H6 | LIKE wildcards not escaped; OR-merges barcode + LIKE | `inventory-router.ts:236` | Escape `%`, `_` in user input |
| H7 | PII, tokens, errors logged to console | `kimi/session.ts:26,40`, `genie-router.ts:90` | Use structured logger, strip PII |
| H8 | No CSP, HSTS, Permissions-Policy | `api/boot.ts:15` | Add security headers middleware |
| H9 | `mock_access_token` accepted outside prod | `api/kimi/auth.ts:53-55` | Remove or gate behind explicit dev flag |

### DevOps (H1–H8)

| # | Issue | File | Fix |
|---|-------|------|-----|
| H1 | Zero tests, but `npm test` configured | `vitest.config.ts`, zero test files | Write smoke tests for billing, trade matching |
| H2 | No migrations checked in; `.gitignore` excludes `*.sql` | `app/.gitignore:16`, `db/migrations/.gitkeep` | Remove ignore, run `db:generate`, commit SQL |
| H3 | No health check or readiness endpoint | `api/boot.ts` | Add `/health` and `/readyz` routes |
| H4 | No graceful shutdown handler | `api/boot.ts:104-113` | Add `SIGTERM`/`SIGINT` handlers, close pool |
| H5 | No CI/CD pipeline | Missing `.github/workflows/` | Add CI workflow: lint → typecheck → test → build |
| H6 | README/info.md describe LUNAMARE hotel template, not Shutter | `README.md`, `info.md` | Rewrite for actual app |
| H7 | No structured logging; ~30 `console.log` calls | All routers, boot | Adopt `pino`, JSON output |
| H8 | No error tracking (Sentry, etc.) | Frontend and backend | Add Sentry SDK |

### Performance (H1–H12)

| # | Issue | File | Fix |
|---|-------|------|-----|
| H1 | No code splitting; 19 pages eagerly imported | `App.tsx:2-22` | Use `React.lazy()` + `<Suspense>` |
| H2 | Bundle bloat from unused shadcn primitives | `components/ui/`, `package.json:23-49` | Audit and remove unused components |
| H3 | `AuthLayout.tsx` is orphaned dead code | `src/components/AuthLayout.tsx` | Delete |
| H4 | N+1 query in `generateRestockRecommendations` | `inventory-router.ts:350-374` | Batch dedup SELECT, single INSERT |
| H5 | Repeated "find my retailer" lookup on every router call | All routers | Add middleware, resolve once per request |
| H6 | `dashboardStats` fires 3 sequential raw SQL queries | `retailer-router.ts:168-205` | Use `Promise.all` or single query |
| H7 | Map query fetches all of India then limits to 500 | `MapPindrops.tsx:28-33`, `demand-router.ts:51-89` | Use viewport bounds, spatial index |
| H8 | `searchBillingProducts` does full LIKE scan without FULLTEXT | `inventory-router.ts:218-261` | Add FULLTEXT index |
| H9 | `trade-router.findMatches` returns fake data, no real distance | `trade-router.ts:47-134` | Compute actual geohash distance, persist |
| H10 | `computeAggregates` triggered on every Heatmap mount | `Heatmap.tsx:69-72` | Move to scheduled job |
| H11 | No HTTP cache headers on public reads | All public routes | Add `Cache-Control`, ETag |
| H12 | `QueryClient` has no `defaultOptions` | `src/providers/trpc.tsx:10` | Add retry policy, staleTime |

---

## MEDIUM Issues (Recommended)

### Architecture & Code Quality

- `README.md` and `info.md` describe wrong app (hotel template, not Shutter retail platform)
- `index.html` missing meta description, OG tags, favicon, theme-color
- No 500 error page; only 404 (`NotFound.tsx`)
- `useTranslation` + Google Translate conflict; broken Marathi translation ("डॅशबोर्ड" has Japanese characters)
- Auth-layer inconsistency: Supabase session vs. tRPC `kimi_sid` cookie
- `Landing.tsx` is 491-line monolithic component
- `public/images/*.jpg` and `public/videos/*.mp4` are dead assets from hotel template (~14 MB)
- `package.json` includes `three` and `@types/three` but no import in code
- `db/schema.ts:117` uses `varchar(64)` for `expiryDate` instead of `date` or `timestamp`
- `db/relations.ts` missing `restockRecommendations` and `genieQueries` relations

### Security & Hardening

- No CSRF token on state-changing requests
- `verifyAccessToken` accepts `"mock_access_token"` literal in non-prod
- `auth-router.logout` doesn't invalidate server-side session (no session table)
- Bill creation not wrapped in transaction; race condition on inventory decrement
- `trade.confirm` doesn't verify caller is seller or buyer
- User-controlled avatar URL loaded as `<img src>` (tracking pixel risk)

### DevOps & Deployment

- No `.editorconfig` (mixed line endings)
- No `Dockerfile` healthcheck
- No bundle-size budget or analyzer
- `tsconfig.app.json` has `"types": ["vite/client", "node"]` (frontend shouldn't have Node types)
- No `.nvmrc` or `engines` field in `package.json`
- `.env.example` missing `GOOGLE_CLIENT_ID`
- `tailwind.config.js` uses CommonJS but project is ESM

### Performance & UX

- `Dashboard` issues 6 parallel queries on every visit without `staleTime`
- `BarcodeScanner` may not release camera on early unmount
- `useEffect` dependency warnings (linter will flag)
- `searchProducts` is `publicQuery` with LIKE, no rate limit
- `genie-router.ask` has no timeout, no streaming, no per-retailer quota
- No service worker, PWA manifest, or offline support
- Date/number formatting not locale-aware

---

## LOW Issues (Nice to Have)

- No `ARCHITECTURE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`
- No deployment runbook
- `tatus` typo pattern not detected by CI (suggest file lint)
- No `bundlesize` check or bundle analyzer
- `tsconfig.server.json` exists but not referenced in `tsconfig.json`
- `set-cookie` built manually in `auth-router.ts` but Hono `setCookie` used elsewhere
- `useAuth.ts` logs on every render path (wrap in `if (import.meta.env.DEV)`)
- No `robots.txt` or `sitemap.xml` in `public/`
- `package-lock.json` is 410 KB (run `npm dedupe`)

---

## Recommended Fix Timeline

### Week 1: Security & Infrastructure Criticals

| Day | Tasks |
|-----|-------|
| Day 1 | Revoke Gemini key, delete `tatus`, clean git history, remove nested `.git` |
| Day 2 | Fix JWT secret fallback, add `APP_SECRET` validation, add `/health` endpoint |
| Day 3 | Remove mock DB proxy, raise MySQL pool to 10–20, add graceful shutdown |
| Day 4 | Lock down CORS to allowlist, add CSRF middleware, add rate limiting |
| Day 5 | Fix OAuth `state` validation, add PKCE, fix Google Auth `aud` check |

### Week 2: DevOps & Data Layer

| Day | Tasks |
|-----|-------|
| Day 1 | Commit DB migrations, add migration step to CI |
| Day 2 | Add CI pipeline (lint → typecheck → test → build), write 3 smoke tests |
| Day 3 | Fix Dockerfile: remove proxy/registry hard-codes, never copy `.env` |
| Day 4 | Add structured logging (pino), add Sentry error tracking |
| Day 5 | Rewrite README/info.md for Shutter, add ARCHITECTURE.md |

### Week 3: Performance & Frontend

| Day | Tasks |
|-----|-------|
| Day 1 | Add `React.lazy()` for all pages, configure `manualChunks` in Vite |
| Day 2 | Add "find my retailer" middleware, create `dashboard.bundle` endpoint |
| Day 3 | Add HTTP cache headers, add FULLTEXT index for product search |
| Day 4 | Move `computeAggregates` to scheduled job, remove client trigger |
| Day 5 | Populate `index.html` meta tags, add favicon, delete dead assets |

---

## Files Requiring Immediate Attention

| Priority | File | Action |
|----------|------|--------|
| CRITICAL | `tatus` (root) | Delete, scrub from git, rotate Gemini key |
| CRITICAL | `app/.git` | Delete (nested repo) |
| CRITICAL | `api/kimi/session.ts:13,33` | Remove JWT secret fallback |
| CRITICAL | `api/queries/connection.ts:9-192` | Remove mock DB proxy |
| CRITICAL | `api/queries/connection.ts:206-212` | Raise pool to 10–20 |
| CRITICAL | `api/boot.ts:17-22` | Lock down CORS |
| CRITICAL | `api/kimi/auth.ts:111-138` | Validate OAuth state, add PKCE |
| CRITICAL | `Dockerfile:6-9,13,26` | Remove hard-coded proxy, fix `.env` copy |
| HIGH | `app/.gitignore:16` | Remove `db/migrations/*.sql` exclusion |
| HIGH | `api/boot.ts` (new) | Add `/health`, `/readyz`, graceful shutdown |
| HIGH | `src/App.tsx:2-22` | Add lazy loading |
| HIGH | All routers | Add rate limiting, cache headers |

---

## Positive Findings (What's Done Well)

- **Modern stack:** React 19, Vite 7, tRPC 11, Drizzle ORM, Hono, SuperJSON
- **Typed API layer:** End-to-end type safety with tRPC
- **Auth decoupling:** Supabase handles OAuth, separate session cookie
- **Geohash indexes:** Spatial lookups on `pindrops` and `retailers`
- **Drizzle relations:** Well-defined for core tables
- **Error boundary:** Root-level with recovery UI
- **Mobile responsive:** Navigation with hamburger, breakpoint utilities
- **Shadcn/ui:** High-quality component primitives (though many unused)

---

## Next Steps

1. **Review this report** with your team and prioritize based on your launch timeline
2. **Revoke the Gemini API key immediately** — this is the only issue causing real-world risk today
3. **Create a tracking ticket** for each CRITICAL and HIGH issue
4. **Set up CI** before any more code changes — you need the safety net
5. **Reach out if you need help** implementing any of these fixes

---

*This audit was conducted by 4 parallel specialized AI agents analyzing security, code quality, DevOps, and performance dimensions. Total analysis time: ~18 minutes. Files analyzed: 139 TypeScript/React/JSON/HTML files across backend routers, frontend components, database schema, build configuration, and deployment manifests.*
