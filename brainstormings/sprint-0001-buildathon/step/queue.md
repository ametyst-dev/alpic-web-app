<!-- Written by step-plan skill. Always overwritten. -->

# Step 8 — Chunk Queue

**Test command:** `npm run build`

## Chunk 1: Add DEMO_API_KEYS auto-approve logic
**Status:** done
**Type:** code
- [x] Add `DEMO_API_KEYS` constant from env var at top of `app/api/wallets/request/route.ts`
- [x] Determine status based on whether api_key is in DEMO_API_KEYS
- [x] Use dynamic status in wallet insert

## Chunk 2: Verify build
**Status:** done
**Type:** test
**Commit point:** chunks 1-2
- [x] `npm run build` passes
