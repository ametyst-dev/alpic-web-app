<!-- Written by step-plan skill. Always overwritten. -->

# Step 1 — Chunk Queue

**Test command:** `npm run build` (TS check only, no automated tests)

## Chunk 1: Deploy `spend_from_wallet` RPC
**Status:** done
- [ ] **HIL:** Run SQL in Supabase SQL Editor (creates atomic spend function) — or apply `supabase/migrations/20260328120000_spend_from_wallet.sql`

## Chunk 2: POST /api/auth/login
**Status:** done
- [ ] Create `app/api/auth/login/route.ts`
- [ ] Verify: curl returns 404 for unknown email

## Chunk 3: GET /api/services
**Status:** done
- [ ] Create `app/api/services/route.ts`
- [ ] Verify: curl returns `[]`

## Chunk 4: POST /api/wallets/request
**Status:** done
- [ ] Create `app/api/wallets/request/route.ts`
- [ ] Verify: curl with bad api_key returns 401

## Chunk 5: GET /api/wallets/check
**Status:** done
- [ ] Create `app/api/wallets/check/route.ts`
- [ ] Verify: curl with fake wallet_id returns 404

## Chunk 6: POST /api/spend
**Status:** done
- [ ] Create `app/api/spend/route.ts`
- [ ] Verify: curl with bad api_key returns 401
