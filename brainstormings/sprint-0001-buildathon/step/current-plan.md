<!-- Written by step-plan skill. Always overwritten. -->

# Step 0 — Project Scaffold + Database

## Context
Sprint 0001-buildathon, repo alpic-web-app. Empty repo (only sprint infra files). This is the first macro step — everything else depends on the project structure and database existing.

## What this step delivers
- Running Next.js (App Router + TypeScript + Tailwind) dev server
- Supabase client at `lib/supabase.ts`
- 4 database tables created (bazar empty — Exa seed deferred, colleague building MOR middleware)
- `.env.local` with Supabase credentials

---

## Operational Guide for Cursor

### Chunk 1: Scaffold Next.js into existing repo

**Problem:** `create-next-app` in the current dir would overwrite README.md and re-init git. **Solution:** Create in a temp subdirectory, selectively move files up.

```bash
# 1a. Create in temp subdirectory
npx create-next-app@latest temp-next --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes

# 1b. Move files up (DO NOT move README.md)
mv temp-next/app ./app
mv temp-next/public ./public
mv temp-next/package.json ./package.json
mv temp-next/package-lock.json ./package-lock.json
mv temp-next/tsconfig.json ./tsconfig.json
mv temp-next/next.config.ts ./next.config.ts
mv temp-next/next-env.d.ts ./next-env.d.ts 2>/dev/null || true
mv temp-next/postcss.config.mjs ./postcss.config.mjs
mv temp-next/.eslintrc.json ./.eslintrc.json 2>/dev/null || true
mv temp-next/eslint.config.mjs ./eslint.config.mjs 2>/dev/null || true
mv temp-next/tailwind.config.ts ./tailwind.config.ts 2>/dev/null || true
mv temp-next/.gitignore ./.gitignore

# 1c. Clean up
rm -rf temp-next

# 1d. Install dependencies
npm install
```

**Verify:** `npm run dev` starts without errors. Existing files (`brainstormings/`, `.claude/`, `.cursor/`, `README.md`) still present.

### Chunk 2: Install Supabase + create client

```bash
npm install @supabase/supabase-js
```

Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Note:** Using `NEXT_PUBLIC_` prefix because the client will be used in browser-side React components (dashboards in Steps 4-6). The Supabase anon key is designed to be public.

### Chunk 3: Create `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**HIL action required:** Fill in real values from Supabase dashboard (Settings > API).

### Chunk 4: Database setup (HIL runs in Supabase SQL Editor)

```sql
create extension if not exists "pgcrypto";

-- admins
create table admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  balance integer not null default 0
);

-- users
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  admin_id uuid not null references admins(id),
  invite_code text not null,
  api_key uuid unique default gen_random_uuid(),
  joined boolean not null default false
);

-- virtual_wallets
create table virtual_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  spending_limit integer not null,
  spent integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected'))
);

-- bazar
create table bazar (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  endpoint_url text not null
);

-- No bazar seed — Exa entry deferred until MOR middleware is ready

-- RLS: allow all (no auth per ADR-003, hackathon only)
alter table admins enable row level security;
alter table users enable row level security;
alter table virtual_wallets enable row level security;
alter table bazar enable row level security;

create policy "Allow all on admins" on admins for all using (true) with check (true);
create policy "Allow all on users" on users for all using (true) with check (true);
create policy "Allow all on virtual_wallets" on virtual_wallets for all using (true) with check (true);
create policy "Allow all on bazar" on bazar for all using (true) with check (true);
```

---

## Verification
1. `npm run dev` starts on port 3000, browser shows default Next.js page
2. `lib/supabase.ts` exists, no TS errors
3. `.env.local` has real Supabase values (HIL)
4. Supabase dashboard shows 4 tables (bazar empty for now)
5. Existing sprint infra files preserved

## HIL actions required
- Fill in `.env.local` with real Supabase URL + anon key
- Run the SQL in Supabase SQL Editor (or confirm tables already exist)
