<!-- Written by step-plan skill. Always overwritten. -->

# Step 4 — Frontend: Login + Routing

## Context
Steps 0-3 complete. All 11 API routes live on Vercel. Now building the login page — email input, call `/api/auth/login`, store role in localStorage, redirect to `/admin` or `/user`.

## What this step delivers
- Landing page with email login form (replaces stock Next.js boilerplate)
- Client-side routing to `/admin` or `/user` based on role from API
- Role + user data stored in localStorage (per ADR-003: no auth, email = identity)

---

## Operational Guide for Cursor

### Chunk 1: Replace `app/page.tsx` with login page

Replace the entire stock boilerplate with a client component (`"use client"`).

**File:** `app/page.tsx`

The page should:
1. Show "Ametyst" as heading and a simple email input + "Login" button
2. On submit, POST to `/api/auth/login` with `{ email }`
3. If 404 → show "No account found" error
4. If success → store `{ role, id, data }` in `localStorage` as `ametyst_user`
5. Redirect to `/admin` if role is "admin", `/user` if role is "user"
6. Use Tailwind for minimal styling — centered card, clean look
7. Show loading state on the button while the API call is in flight

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      localStorage.setItem("ametyst_user", JSON.stringify(data))
      router.push(data.role === "admin" ? "/admin" : "/user")
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Ametyst</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
```

### Chunk 2: Update layout metadata

**File:** `app/layout.tsx`

Change the metadata title from "Create Next App" to "Ametyst" and description to "Ametyst hackathon demo".

---

## Verification
1. `npm run build` passes
2. Visit `localhost:3000` → see login form with email input
3. Enter a non-existent email → "No account found" error
4. Enter an admin email (after creating one in Supabase) → redirects to `/admin` (will 404 for now, that's expected — dashboard built in Step 5)
5. localStorage has `ametyst_user` key after login

## HIL actions required
None — pure code step.
