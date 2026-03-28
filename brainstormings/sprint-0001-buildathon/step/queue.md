<!-- Written by step-plan skill. Always overwritten. -->

# Step 0 — Chunk Queue

**Test command:** N/A

## Chunk 1: Scaffold Next.js into existing repo
**Status:** done
- [x] Run `npx create-next-app@latest temp-next` with flags
- [x] Move files from temp-next to root (preserve README.md)
- [x] Clean up temp-next directory
- [x] `npm install`
- [x] Verify `npm run dev` starts

## Chunk 2: Install Supabase + create client
**Status:** done
- [x] `npm install @supabase/supabase-js`
- [x] Create `lib/supabase.ts`

## Chunk 3: Create `.env.local`
**Status:** done
- [x] Create `.env.local` with placeholder values
- [ ] **HIL:** Fill in real Supabase URL + anon key

## Chunk 4: Database setup
**Status:** blocked
- [ ] **HIL:** Run SQL in Supabase SQL Editor (create 4 tables + RLS policies)
- [ ] Verify tables exist in Supabase dashboard
