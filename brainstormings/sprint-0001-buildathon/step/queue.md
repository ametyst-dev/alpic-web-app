<!-- Written by step-plan skill. Always overwritten. -->

# Step 2 — Chunk Queue

**Test command:** `npm run build` (TS check, all 11 routes registered)

## Chunk 1: Admin topup + invite
**Status:** done
- [x] Create `app/api/admin/topup/route.ts`
- [x] Create `app/api/admin/invite/route.ts`

## Chunk 2: Admin wallet management
**Status:** done
- [x] Create `app/api/admin/wallets/route.ts` (GET with inner join)
- [x] Create `app/api/admin/wallets/[id]/route.ts` (PATCH, params is Promise)

## Chunk 3: User onboarding
**Status:** done
- [x] Create `app/api/user/join/route.ts`
- [x] Create `app/api/user/generate-key/route.ts`
