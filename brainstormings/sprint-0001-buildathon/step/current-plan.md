<!-- Written by step-plan skill. Always overwritten. -->

# Step 5 — Frontend: Admin Dashboard

## Context
Steps 0-4 complete. Login page routes to `/admin`. Now building the admin dashboard — a single client component page at `app/admin/page.tsx`.

## What this step delivers
- Admin dashboard with: balance display, top-up form, invite form, wallet requests list with approve/reject
- All powered by existing API routes

---

## Operational Guide for Cursor

### Chunk 1: Create `app/admin/page.tsx`

**File:** `app/admin/page.tsx`

Single `"use client"` component. On mount, read `ametyst_user` from localStorage. If not found or role !== "admin", redirect to `/`. Otherwise show the dashboard.

**Sections:**

**1. Header** — "Admin Dashboard" + admin email + logout button (clears localStorage, redirects to `/`)

**2. Balance + Top-up** — Show current balance. Input for amount + "Top Up" button. POST `/api/admin/topup` with `{ admin_id, amount }`. On success, update displayed balance.

**3. Invite User** — Input for email + "Invite" button. POST `/api/admin/invite` with `{ admin_id, email }`. On success, show the generated invite code so admin can share it.

**4. Wallet Requests** — On mount, GET `/api/admin/wallets?admin_id=`. Display table/list of wallets with: user email, spending_limit, spent, status. For pending wallets, show Approve/Reject buttons. PATCH `/api/admin/wallets/:id` with `{ status: "approved" }` or `{ status: "rejected" }`. Refresh list after action.

**Code structure:**
```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Types
interface AdminUser { role: string; id: string; data: { email: string; balance: number } }
interface Wallet { id: string; user_id: string; spending_limit: number; spent: number; status: string; users: { email: string } }

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [balance, setBalance] = useState(0)

  // Top-up state
  const [topupAmount, setTopupAmount] = useState("")

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  // Wallets state
  const [wallets, setWallets] = useState<Wallet[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("ametyst_user")
    if (!stored) { router.push("/"); return }
    const parsed = JSON.parse(stored)
    if (parsed.role !== "admin") { router.push("/"); return }
    setUser(parsed)
    setBalance(parsed.data.balance)
    loadWallets(parsed.id)
  }, [router])

  async function loadWallets(adminId: string) {
    const res = await fetch(`/api/admin/wallets?admin_id=${adminId}`)
    const data = await res.json()
    setWallets(data)
  }

  async function handleTopup() {
    if (!user || !topupAmount) return
    const res = await fetch("/api/admin/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_id: user.id, amount: Number(topupAmount) }),
    })
    const data = await res.json()
    if (res.ok) { setBalance(data.new_balance); setTopupAmount("") }
  }

  async function handleInvite() {
    if (!user || !inviteEmail) return
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_id: user.id, email: inviteEmail }),
    })
    const data = await res.json()
    if (res.ok) { setInviteCode(data.invite_code); setInviteEmail("") }
  }

  async function handleWalletAction(walletId: string, status: string) {
    await fetch(`/api/admin/wallets/${walletId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (user) loadWallets(user.id)
  }

  function handleLogout() {
    localStorage.removeItem("ametyst_user")
    router.push("/")
  }

  if (!user) return null

  // Render: header, balance+topup section, invite section, wallets table
  // Use Tailwind — consistent with login page style (zinc palette, rounded-lg, etc.)
}
```

**Tailwind styling guidelines:**
- Same zinc palette as login page
- Card-style sections with `rounded-xl border border-zinc-200 p-6 dark:border-zinc-800`
- Inputs same style as login: `rounded-lg border border-zinc-300 px-4 py-2`
- Buttons same style as login: `rounded-lg bg-zinc-900 text-white`
- Approve button: green variant, Reject button: red variant
- Status badges: pending=yellow, approved=green, rejected=red

---

## Verification
1. `npm run build` passes
2. Visit `/admin` with admin in localStorage → see dashboard
3. Top-up updates balance display
4. Invite shows invite code
5. Wallet list loads, approve/reject buttons work

## HIL actions required
None — pure code step.
