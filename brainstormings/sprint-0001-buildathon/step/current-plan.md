<!-- Written by step-plan skill. Always overwritten. -->

# Step 1 — Core API Routes (MCP-facing)

## Context
Sprint 0001-buildathon, Step 0 complete (scaffold + DB). The MCP teammate is blocked until these 5 endpoints are live. This is the critical path.

## What this step delivers
5 working API routes that the MCP server can call:
- `POST /api/auth/login`
- `GET /api/services`
- `POST /api/wallets/request`
- `GET /api/wallets/check`
- `POST /api/spend` (with atomic double-decrement via Supabase RPC)

---

## Operational Guide for Cursor

### Chunk 1: HIL — Deploy `spend_from_wallet` RPC to Supabase

**Must be done first** — Chunk 6 depends on it. Run in Supabase SQL Editor:

```sql
create or replace function spend_from_wallet(
  p_wallet_id uuid,
  p_user_id uuid,
  p_admin_id uuid,
  p_amount integer
)
returns json
language plpgsql
as $$
declare
  v_wallet virtual_wallets%rowtype;
  v_admin admins%rowtype;
begin
  select * into v_wallet
    from virtual_wallets
    where id = p_wallet_id and user_id = p_user_id
    for update;

  if not found then
    return json_build_object('error', 'wallet not found or not owned by user');
  end if;

  if v_wallet.status <> 'approved' then
    return json_build_object('error', 'wallet not approved');
  end if;

  if v_wallet.spending_limit - v_wallet.spent < p_amount then
    return json_build_object('error', 'insufficient wallet balance');
  end if;

  select * into v_admin
    from admins
    where id = p_admin_id
    for update;

  if v_admin.balance < p_amount then
    return json_build_object('error', 'insufficient admin balance');
  end if;

  update virtual_wallets
    set spent = spent + p_amount
    where id = p_wallet_id;

  update admins
    set balance = balance - p_amount
    where id = p_admin_id;

  return json_build_object(
    'remaining', v_wallet.spending_limit - v_wallet.spent - p_amount,
    'admin_balance', v_admin.balance - p_amount
  );
end;
$$;
```

### Chunk 2: `POST /api/auth/login`

**File:** `app/api/auth/login/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (admin) {
    return NextResponse.json({ role: 'admin', id: admin.id, data: admin })
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (user) {
    return NextResponse.json({ role: 'user', id: user.id, data: user })
  }

  return NextResponse.json({ error: 'no account found' }, { status: 404 })
}
```

### Chunk 3: `GET /api/services`

**File:** `app/api/services/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('bazar').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Chunk 4: `POST /api/wallets/request`

**File:** `app/api/wallets/request/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { api_key, spending_limit } = await request.json()

  if (!api_key || spending_limit == null) {
    return NextResponse.json(
      { error: 'api_key and spending_limit are required' },
      { status: 400 }
    )
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', api_key)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'invalid api_key' }, { status: 401 })
  }

  if (!user.joined) {
    return NextResponse.json({ error: 'user has not joined yet' }, { status: 403 })
  }

  const { data: wallet, error } = await supabase
    .from('virtual_wallets')
    .insert({ user_id: user.id, spending_limit, status: 'pending' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(wallet, { status: 201 })
}
```

### Chunk 5: `GET /api/wallets/check`

**File:** `app/api/wallets/check/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wallet_id = searchParams.get('wallet_id')

  if (!wallet_id) {
    return NextResponse.json(
      { error: 'wallet_id query param is required' },
      { status: 400 }
    )
  }

  const { data: wallet, error } = await supabase
    .from('virtual_wallets')
    .select('*')
    .eq('id', wallet_id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!wallet) {
    return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
  }

  return NextResponse.json(wallet)
}
```

### Chunk 6: `POST /api/spend`

**File:** `app/api/spend/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { api_key, wallet_id, amount } = await request.json()

  if (!api_key || !wallet_id || amount == null) {
    return NextResponse.json(
      { error: 'api_key, wallet_id, and amount are required' },
      { status: 400 }
    )
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', api_key)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'invalid api_key' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('spend_from_wallet', {
    p_wallet_id: wallet_id,
    p_user_id: user.id,
    p_admin_id: user.admin_id,
    p_amount: amount,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }

  return NextResponse.json(data)
}
```

---

## Verification
1. `npm run build` — no TS errors
2. `curl -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"x@x.com"}'` → 404
3. `curl localhost:3000/api/services` → `[]`
4. `curl -X POST localhost:3000/api/wallets/request -H 'Content-Type: application/json' -d '{"api_key":"bad","spending_limit":100}'` → 401
5. `curl 'localhost:3000/api/wallets/check?wallet_id=00000000-0000-0000-0000-000000000000'` → 404
6. `curl -X POST localhost:3000/api/spend -H 'Content-Type: application/json' -d '{"api_key":"bad","wallet_id":"x","amount":10}'` → 401

## HIL actions required
- Run the `spend_from_wallet` SQL function in Supabase SQL Editor (Chunk 1) before Cursor starts Chunk 6
