<!-- Written by step-plan skill. Always overwritten. -->

# Step 8 — UPGRADE: Auto-approve demo wallet requests

## Context
UPGRADE_PROPOSED from domain-expansion: demo users from LinkedIn need to test the full spend flow without waiting for manual admin wallet approval. Normal users still go through the standard `pending` → admin approval flow.

## What this step delivers
In `app/api/wallets/request/route.ts`, after finding the user by `api_key`, check if the key is in a `DEMO_API_KEYS` list (read from env var). If yes, insert the wallet with `status: 'approved'` instead of `'pending'`.

---

## Operational Guide for Cursor

### Chunk 1: Modify `app/api/wallets/request/route.ts`

**File:** `app/api/wallets/request/route.ts`

1. Add a `DEMO_API_KEYS` constant at the top (after imports):
   ```typescript
   const DEMO_API_KEYS = (process.env.DEMO_API_KEYS ?? '').split(',').filter(Boolean)
   ```

2. Before the wallet insert, determine status:
   ```typescript
   const status = DEMO_API_KEYS.includes(api_key) ? 'approved' : 'pending'
   ```

3. Use `status` variable in the insert instead of hardcoded `'pending'`.

### Chunk 2: Verify build

Run `npm run build` — must pass with no errors.

---

## Verification
1. `npm run build` passes
2. POST `/api/wallets/request` with a demo API key → wallet returned with `status: 'approved'`
3. POST `/api/wallets/request` with a normal API key → wallet returned with `status: 'pending'` (unchanged)
4. Configure `DEMO_API_KEYS` env var in Vercel (comma-separated list of demo API keys)

## HIL actions required
- Add `DEMO_API_KEYS` env var in Vercel with the demo API key values
