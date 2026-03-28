<!-- Written by step-plan skill. Always overwritten. -->

# Step 6 — Frontend: User Dashboard

## Context
Steps 0-5 complete. Login routes to `/user`. Now building the user dashboard — join with invite code, generate API key, view wallet status.

## What this step delivers
- User dashboard at `app/user/page.tsx`
- Join flow for users who haven't joined yet
- API key generation + display
- Info about MCP wallet management

---

## Operational Guide for Cursor

### Chunk 1: Create `app/user/page.tsx`

**File:** `app/user/page.tsx`

Single `"use client"` component. On mount, read `ametyst_user` from localStorage. If not found or role !== "user", redirect to `/`.

**Two states based on `user.data.joined`:**

**State A: Not joined** — Show join form:
- Pre-filled email (from localStorage data)
- Invite code input
- "Join" button → POST `/api/user/join` with `{ email, invite_code }`
- On success, update localStorage with the returned user (joined=true), re-render to State B

**State B: Joined** — Show dashboard sections:

**1. Header** — "User Dashboard" + email + logout button

**2. API Key** — If `user.data.api_key` exists, show it in a monospace box. Show "Regenerate API Key" button → POST `/api/user/generate-key` with `{ user_id }`. On success, update displayed key + localStorage.

**3. Info** — "Your wallets are managed through the MCP interface. Use your API key to request wallets and spend."

**Styling:** Same zinc palette and card style as admin dashboard.

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const STORAGE_KEY = "ametyst_user"

type StoredUser = {
  role: string
  id: string
  data: { email: string; api_key: string; joined: boolean; invite_code: string }
}

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [ready, setReady] = useState(false)

  // Join state
  const [inviteCode, setInviteCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [joinBusy, setJoinBusy] = useState(false)

  // API key state
  const [apiKey, setApiKey] = useState("")
  const [keyBusy, setKeyBusy] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) { router.replace("/"); return }
    try {
      const parsed = JSON.parse(raw) as StoredUser
      if (parsed.role !== "user") { router.replace("/"); return }
      setUser(parsed)
      setApiKey(parsed.data.api_key || "")
      setReady(true)
    } catch { router.replace("/") }
  }, [router])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setJoinError("")
    setJoinBusy(true)
    try {
      const res = await fetch("/api/user/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.data.email, invite_code: inviteCode }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error || "Join failed"); return }
      const updated = { ...user, data: data }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setUser(updated)
      setApiKey(data.api_key || "")
    } catch { setJoinError("Network error") }
    finally { setJoinBusy(false) }
  }

  async function handleGenerateKey() {
    if (!user) return
    setKeyBusy(true)
    try {
      const res = await fetch("/api/user/generate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setApiKey(data.api_key)
        const updated = { ...user, data: { ...user.data, api_key: data.api_key } }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        setUser(updated)
      }
    } finally { setKeyBusy(false) }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    router.replace("/")
  }

  if (!ready || !user) return null

  // If not joined → show join form
  // If joined → show header, API key section, MCP info
}
```

---

## Verification
1. `npm run build` passes
2. Visit `/user` with user in localStorage → see join form or dashboard
3. Join with invite code → transitions to joined state
4. Generate API key → monospace display
5. Logout → redirects to `/`

## HIL actions required
None — pure code step.
