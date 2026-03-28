<!-- Written by step-plan skill. Always overwritten. -->

# Step 2 — Admin + User API Routes

## Context
Sprint 0001-buildathon, Steps 0-1 complete. All 5 MCP-facing routes live. Now building the 6 remaining routes that power the admin dashboard and user onboarding. After this step, all 11 API endpoints are working.

## What this step delivers
6 API routes:
- `POST /api/admin/topup` — mock top-up admin balance
- `POST /api/admin/invite` — invite user by email
- `GET /api/admin/wallets` — list wallets for admin's users
- `PATCH /api/admin/wallets/:id` — approve/reject wallet
- `POST /api/user/join` — join with invite code
- `POST /api/user/generate-key` — generate API key

No HIL actions needed — pure code.

---

## Operational Guide for Cursor

### Chunk 1: Admin topup + invite

**File:** `app/api/admin/topup/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { admin_id, amount } = await request.json()

  if (!admin_id || amount == null) {
    return NextResponse.json(
      { error: 'admin_id and amount are required' },
      { status: 400 }
    )
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', admin_id)
    .maybeSingle()

  if (!admin) {
    return NextResponse.json({ error: 'admin not found' }, { status: 404 })
  }

  const { data: updated, error } = await supabase
    .from('admins')
    .update({ balance: admin.balance + amount })
    .eq('id', admin_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ new_balance: updated.balance })
}
```

**File:** `app/api/admin/invite/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { admin_id, email } = await request.json()

  if (!admin_id || !email) {
    return NextResponse.json(
      { error: 'admin_id and email are required' },
      { status: 400 }
    )
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', admin_id)
    .maybeSingle()

  if (!admin) {
    return NextResponse.json({ error: 'admin not found' }, { status: 404 })
  }

  const invite_code = crypto.randomUUID()

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, admin_id, invite_code, joined: false })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invite_code }, { status: 201 })
}
```

### Chunk 2: Admin wallet management

**File:** `app/api/admin/wallets/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const admin_id = searchParams.get('admin_id')

  if (!admin_id) {
    return NextResponse.json(
      { error: 'admin_id query param is required' },
      { status: 400 }
    )
  }

  const { data: wallets, error } = await supabase
    .from('virtual_wallets')
    .select('*, users!inner(email, admin_id)')
    .eq('users.admin_id', admin_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(wallets)
}
```

**File:** `app/api/admin/wallets/[id]/route.ts`

**Important:** Next.js 16 makes `params` a Promise in route handlers.

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await request.json()

  if (!status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be "approved" or "rejected"' },
      { status: 400 }
    )
  }

  const { data: wallet, error } = await supabase
    .from('virtual_wallets')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!wallet) {
    return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
  }

  return NextResponse.json(wallet)
}
```

### Chunk 3: User onboarding

**File:** `app/api/user/join/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email, invite_code } = await request.json()

  if (!email || !invite_code) {
    return NextResponse.json(
      { error: 'email and invite_code are required' },
      { status: 400 }
    )
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('invite_code', invite_code)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'invalid email or invite code' }, { status: 404 })
  }

  if (user.joined) {
    return NextResponse.json({ error: 'user has already joined' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update({ joined: true })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
```

**File:** `app/api/user/generate-key/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { user_id } = await request.json()

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id is required' },
      { status: 400 }
    )
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const api_key = crypto.randomUUID()

  const { data: updated, error } = await supabase
    .from('users')
    .update({ api_key })
    .eq('id', user_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ api_key: updated.api_key })
}
```

---

## Verification
1. `npm run build` — no TS errors, all 11 routes registered
2. curl smoke tests with invalid data return proper error codes
3. After this step, all 11 API endpoints from the sprint guidelines are complete

## HIL actions required
None — pure code step.
