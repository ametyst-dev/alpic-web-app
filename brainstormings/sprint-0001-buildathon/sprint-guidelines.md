# Sprint 0001 — buildathon

## Meta
channel: sprint-0001-buildathon
agent_name: alpic-web-app
sprint_goal: Build the Ametyst web app + backend for the hackathon demo — admin dashboard, user portal, and API routes that the MCP server consumes. Ship in ~3 hours.

## Context
This is a brand new Next.js project (empty repo). The app serves both frontend (admin + user dashboards) and backend (API routes) for the Ametyst hackathon demo. It connects to Supabase for persistence and deploys on Vercel. The MCP server (built by a teammate on Alpic) calls the API routes to authenticate users, discover services, manage wallets, and execute payments.

Tech stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase (Postgres), Vercel.

Data model (4 tables):
- admins: id (uuid PK), email (text unique), balance (integer default 0)
- users: id (uuid PK), email (text unique), admin_id (FK admins), invite_code (text), api_key (uuid unique), joined (boolean default false)
- virtual_wallets: id (uuid PK), user_id (FK users), spending_limit (integer), spent (integer default 0), status (text: pending/approved/rejected)
- bazar: id (uuid PK), name (text), description (text), endpoint_url (text)

API contract:
- POST /api/auth/login — { email } → { role, id, data }
- POST /api/admin/topup — { admin_id, amount } → { new_balance }
- POST /api/admin/invite — { admin_id, email } → { invite_code }
- GET /api/admin/wallets — ?admin_id= → [wallets with status]
- PATCH /api/admin/wallets/:id — { status } → { updated_wallet }
- POST /api/user/join — { email, invite_code } → { user }
- POST /api/user/generate-key — { user_id } → { api_key }
- GET /api/services — → [bazar entries]
- POST /api/wallets/request — { api_key, spending_limit } → { wallet }
- GET /api/wallets/check — ?wallet_id= → { status }
- POST /api/spend — { api_key, wallet_id, amount } → { remaining, admin_balance }

Spend logic: double decrement — increment virtual_wallets.spent AND decrement admins.balance in same transaction.

## Architecture Decision Records

### ADR-001 — Single Next.js app for frontend + backend
- **Context:** Need both a web UI and REST API endpoints, built by one person in 3 hours
- **Decision:** Use Next.js App Router with API routes (`/app/api/*`) serving as the backend
- **Alternatives:** Separate Express backend + React frontend (rejected: double the deployment, CORS config, two repos to manage)
- **Consequences for this repo:** One deploy on Vercel. MCP server calls the same domain as the web app. No CORS issues.

### ADR-002 — Supabase for database
- **Context:** Need hosted Postgres with zero ops, free tier, and a dashboard for live debugging during demo
- **Decision:** Use Supabase free tier with `@supabase/supabase-js` SDK
- **Consequences for this repo:** Supabase client initialized in `lib/supabase.ts`, env vars SUPABASE_URL and SUPABASE_ANON_KEY.

### ADR-003 — No auth, email-only identity
- **Context:** 3-hour hackathon, no time for proper auth
- **Decision:** Email = identity. If email exists in admins table → admin. If in users table → user. No passwords, no sessions, no JWT.
- **Consequences for this repo:** Role stored in localStorage after login.

### ADR-004 — Double decrement on spend
- **Context:** When a user spends from a virtual wallet, both the wallet balance and the admin's global balance must decrease
- **Decision:** `/api/spend` increments `virtual_wallets.spent` AND decrements `admins.balance` atomically
- **Consequences for this repo:** Spend endpoint uses Supabase RPC or sequential updates.

## Test strategy

- **Test command:** none (hackathon, no automated tests)
- **Unit tests:** none
- **Integration tests:** none — manual testing only
- **Not tested:** everything automated
- **Credentials:** Supabase URL + anon key in `.env.local` and Vercel env vars

## Macro steps

### Step 0 — Project scaffold + database
**What:** Create the Next.js project with TypeScript + Tailwind. Set up Supabase project, create 4 tables (admins, users, virtual_wallets, bazar), seed bazar with Exa service. Configure env vars and Supabase client.
**Why:** Everything depends on the DB and project structure existing first.
**Output:** Running Next.js dev server, Supabase tables created, `lib/supabase.ts` working.
**Files:** root — `npx create-next-app`, `package.json`, `.env.local`, `lib/supabase.ts`

### Step 1 — Core API routes (MCP-facing)
**What:** Build the API routes the MCP server needs first: `/api/auth/login`, `/api/services`, `/api/wallets/request`, `/api/wallets/check`, `/api/spend`.
**Why:** The MCP teammate is blocked until these endpoints are live. This is the critical path.
**Output:** 5 working API routes that the MCP server can call.
**Files:**
- `app/api/auth/login/route.ts`
- `app/api/services/route.ts`
- `app/api/wallets/request/route.ts`
- `app/api/wallets/check/route.ts`
- `app/api/spend/route.ts`

### Step 2 — Admin + User API routes
**What:** Build remaining API routes: topup, invite, wallets list/approve, join, generate-key.
**Why:** These power the web app UI and complete the API surface.
**Output:** All 11 API endpoints working.
**Files:**
- `app/api/admin/topup/route.ts`
- `app/api/admin/invite/route.ts`
- `app/api/admin/wallets/route.ts`
- `app/api/admin/wallets/[id]/route.ts`
- `app/api/user/join/route.ts`
- `app/api/user/generate-key/route.ts`

### Step 3 — Deploy to Vercel
**What:** Deploy the app to Vercel, configure env vars, share the live URL.
**Why:** MCP teammate needs live endpoints to integrate.
**Output:** Live URL with all API routes accessible.
**Files:** Vercel configuration, no code changes expected.

### Step 4 — Frontend: login + routing
**What:** Build the landing page with email login. Route to /admin or /user based on role.
**Output:** Working login page that routes to the correct dashboard.
**Files:** `app/page.tsx`

### Step 5 — Frontend: admin dashboard
**What:** Build admin page with overview, topup, invite, approve wallets.
**Output:** Working admin dashboard.
**Files:** `app/admin/page.tsx`

### Step 6 — Frontend: user dashboard
**What:** Build user page with join flow, generate API key, wallet status.
**Output:** Working user dashboard.
**Files:** `app/user/page.tsx`

### Step 7 — Stabilization
**What:** End-to-end test, integration fixes, polish.
**Output:** Working end-to-end demo flow.
**Files:** Various — bug fixes across all files as needed.

## Constraints
- Ship in ~3 hours — speed over perfection
- No real auth — email-only identity
- No automated tests — manual testing only
- MCP teammate is blocked until Step 3 (deploy) — prioritize API routes and deploy
- Bazar table is hardcoded with 1-2 services (Exa), no CRUD
- Mock top-up only — no Stripe or real payment integration

## Definition of done
- [ ] All 11 API routes return correct responses
- [ ] Admin can: login, top-up, invite user, approve wallet
- [ ] User can: login, join with code, generate API key
- [ ] MCP server can: find services, request wallet, check status, spend
- [ ] Spend correctly decrements both wallet.spent and admin.balance
- [ ] App deployed on Vercel with live URL
- [ ] End-to-end demo flow works
