"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  role: string;
  id: string;
  data: {
    email?: string;
    joined?: boolean;
    api_key?: string | null;
    [key: string]: unknown;
  };
};

const STORAGE_KEY = "ametyst_user";

export default function UserDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [joinEmail, setJoinEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }
    let parsed: StoredUser;
    try {
      parsed = JSON.parse(raw) as StoredUser;
    } catch {
      router.replace("/");
      return;
    }
    if (parsed.role !== "user" || !parsed.id) {
      router.replace("/");
      return;
    }
    setUser(parsed);
    setJoinEmail(
      typeof parsed.data?.email === "string" ? parsed.data.email : ""
    );
    setReady(true);
  }, [router]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setJoinError("");
    setJoinBusy(true);
    try {
      const res = await fetch("/api/user/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: joinEmail.trim(),
          invite_code: inviteCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Join failed");
        return;
      }
      const next: StoredUser = {
        role: "user",
        id: data.id,
        data: data,
      };
      setUser(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setInviteCode("");
    } catch {
      setJoinError("Network error");
    } finally {
      setJoinBusy(false);
    }
  }

  async function handleRegenerateKey() {
    if (!user) return;
    setRegenError("");
    setRegenBusy(true);
    try {
      const res = await fetch("/api/user/generate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegenError(data.error || "Could not regenerate key");
        return;
      }
      const next: StoredUser = {
        ...user,
        data: { ...user.data, api_key: data.api_key },
      };
      setUser(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setRegenError("Network error");
    } finally {
      setRegenBusy(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    router.replace("/");
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  const joined = Boolean(user.data.joined);

  return (
    <div className="min-h-full flex-1 bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              User
            </h1>
            {user.data.email && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.data.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Logout
          </button>
        </header>

        {!joined ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Complete signup
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Enter the email you were invited with and your invite code.
            </p>
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="join-email"
                  className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Email
                </label>
                <input
                  id="join-email"
                  type="email"
                  required
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="invite-code"
                  className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Invite code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
                  placeholder="Invite code"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={joinBusy}
                className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {joinBusy ? "Joining…" : "Join"}
              </button>
            </form>
            {joinError && (
              <p className="mt-4 text-sm text-red-500">{joinError}</p>
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              API key
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Use this key for API requests. Regenerating invalidates the
              previous key.
            </p>
            <div className="rounded-lg bg-zinc-100 px-4 py-3 font-mono text-sm break-all text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              {user.data.api_key
                ? String(user.data.api_key)
                : "No key yet — generate one below."}
            </div>
            <button
              type="button"
              onClick={() => void handleRegenerateKey()}
              disabled={regenBusy}
              className="mt-4 rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {regenBusy ? "Generating…" : "Regenerate key"}
            </button>
            {regenError && (
              <p className="mt-2 text-sm text-red-500">{regenError}</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
