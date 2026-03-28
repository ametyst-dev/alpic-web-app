"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";
type SignupRole = "admin" | "user";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupRole, setSignupRole] = useState<SignupRole>("admin");
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setError("No account found");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }

      localStorage.setItem("ametyst_user", JSON.stringify(data));
      router.push(data.role === "admin" ? "/admin" : "/user");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: { email: string; role: SignupRole; invite_code?: string } = {
        email,
        role: signupRole,
      };
      if (signupRole === "user") {
        body.invite_code = inviteCode;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign up failed");
        return;
      }

      localStorage.setItem("ametyst_user", JSON.stringify(data));
      router.push(data.role === "admin" ? "/admin" : "/user");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-8 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Ametyst
        </h1>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="font-medium text-zinc-900 underline dark:text-zinc-100"
              >
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex gap-2 rounded-lg border border-zinc-300 p-1 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setSignupRole("admin")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  signupRole === "admin"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setSignupRole("user")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  signupRole === "user"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                User
              </button>
            </div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
            />
            {signupRole === "user" && (
              <input
                type="text"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-100"
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className="font-medium text-zinc-900 underline dark:text-zinc-100"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
