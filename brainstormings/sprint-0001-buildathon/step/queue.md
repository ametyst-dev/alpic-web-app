<!-- Written by step-plan skill. Always overwritten. -->

# Step 7 — Chunk Queue

**Test command:** `npm run build`

## Chunk 1: Create POST /api/auth/signup
**Status:** done
- [ ] Create `app/api/auth/signup/route.ts`
- [ ] Admin signup: insert into admins table, return { role, id, data }
- [ ] User signup: verify email + invite_code, mark joined=true, return { role, id, data }

## Chunk 2: Update app/page.tsx with Sign In / Sign Up toggle
**Status:** done
- [ ] Add mode toggle: Sign In (default) / Sign Up
- [ ] Sign Up form: email + role selector (Admin/User) + invite code (User only)
- [ ] POST /api/auth/signup on submit → localStorage → redirect
- [ ] Keep existing Sign In logic
- [ ] "Don't have an account?" / "Already have an account?" links
