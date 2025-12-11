// src/pages/auth/Login.tsx

import type { User } from "@/api/types";
import { api } from "@/api/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = email.trim() !== "" && password.trim() !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setErr(null);

    try {
      const user: User = await api.login(email, password);
      console.log("user", user);

      const token = user.token ?? null;
      if (token) {
        localStorage.setItem("pc_auth_token", token);
      }

      if (user) {
        localStorage.setItem("pc_auth_user", JSON.stringify(user.name));
      }

      // redirect to home
      navigate("/projects", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto text-sm text-muted-foreground hover:text-foreground"
            aria-label={showPw ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-md border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-600">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms & Privacy Policy.
      </div>
    </form>
  );
}
