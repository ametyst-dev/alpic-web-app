"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  role: string;
  id: string;
  data: { balance: number; email?: string };
};

type WalletRow = {
  id: string;
  user_id: string;
  spending_limit: number;
  spent: number;
  status: string;
  users: { email: string; admin_id?: string };
};

const STORAGE_KEY = "ametyst_user";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<StoredUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupBusy, setTopupBusy] = useState(false);
  const [topupError, setTopupError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [walletActionId, setWalletActionId] = useState<string | null>(null);

  const loadWallets = useCallback(async (adminId: string) => {
    setWalletsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/wallets?admin_id=${encodeURIComponent(adminId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setWallets([]);
        return;
      }
      setWallets(Array.isArray(data) ? data : []);
    } catch {
      setWallets([]);
    } finally {
      setWalletsLoading(false);
    }
  }, []);

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
    if (parsed.role !== "admin" || !parsed.id) {
      router.replace("/");
      return;
    }
    setAdmin(parsed);
    setBalance(
      typeof parsed.data?.balance === "number" ? parsed.data.balance : 0
    );
    setReady(true);
    void loadWallets(parsed.id);
  }, [router, loadWallets]);

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!admin) return;
    setTopupError("");
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTopupError("Enter a positive amount");
      return;
    }
    setTopupBusy(true);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: admin.id, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTopupError(data.error || "Top-up failed");
        return;
      }
      setBalance(data.new_balance);
      const next = { ...admin, data: { ...admin.data, balance: data.new_balance } };
      setAdmin(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setTopupAmount("");
    } catch {
      setTopupError("Network error");
    } finally {
      setTopupBusy(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!admin) return;
    setInviteError("");
    setLastInviteCode(null);
    setInviteBusy(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: admin.id, email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Invite failed");
        return;
      }
      setLastInviteCode(data.invite_code ?? null);
      setInviteEmail("");
    } catch {
      setInviteError("Network error");
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleWalletAction(walletId: string, status: "approved" | "rejected") {
    if (!admin) return;
    setWalletActionId(walletId);
    try {
      const res = await fetch(`/api/admin/wallets/${walletId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadWallets(admin.id);
      }
    } finally {
      setWalletActionId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    router.replace("/");
  }

  if (!ready || !admin) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Admin
            </h1>
            {admin.data.email && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {admin.data.email}
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

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Balance
          </h2>
          <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {balance != null ? balance.toLocaleString() : "—"}
          </p>
          <form onSubmit={handleTopup} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="topup"
                className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
              >
                Top up amount
              </label>
              <input
                id="topup"
                type="number"
                min={1}
                step={1}
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
                placeholder="Amount"
              />
            </div>
            <button
              type="submit"
              disabled={topupBusy}
              className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {topupBusy ? "Adding…" : "Add credit"}
            </button>
          </form>
          {topupError && (
            <p className="mt-2 text-sm text-red-500">{topupError}</p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Invite user
          </h2>
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="invite-email"
                className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
              >
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
                placeholder="user@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={inviteBusy}
              className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {inviteBusy ? "Sending…" : "Invite"}
            </button>
          </form>
          {inviteError && (
            <p className="mt-2 text-sm text-red-500">{inviteError}</p>
          )}
          {lastInviteCode && (
            <p className="mt-4 rounded-lg bg-zinc-100 px-4 py-3 font-mono text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              Invite code: {lastInviteCode}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Wallet requests
          </h2>
          {walletsLoading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading wallets…
            </p>
          ) : wallets.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No wallets yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {wallets.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Email:
                      </span>{" "}
                      {w.users?.email ?? "—"}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Limit:
                      </span>{" "}
                      {w.spending_limit}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Spent:
                      </span>{" "}
                      {w.spent}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Status:
                      </span>{" "}
                      {w.status}
                    </span>
                  </div>
                  {w.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={walletActionId === w.id}
                        onClick={() => handleWalletAction(w.id, "approved")}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={walletActionId === w.id}
                        onClick={() => handleWalletAction(w.id, "rejected")}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
