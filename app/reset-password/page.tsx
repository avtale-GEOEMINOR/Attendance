"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase's password-reset link logs the user into a temporary
    // recovery session automatically when they land on this page (it
    // processes the token from the URL fragment). We just need to confirm
    // that session exists before letting them set a new password.
    supabase.auth.getSession().then(({ data }) => {
      setHasValidSession(!!data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasValidSession(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  if (checkingSession) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <p className="text-sm text-muted">Verifying your link…</p>
      </main>
    );
  }

  if (!hasValidSession) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink mb-3">
            Link expired or invalid
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            This password reset link may have expired or already been used.
            Request a new one to continue.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Request a new link
          </Button>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink mb-3">
            Password updated
          </h1>
          <p className="text-sm text-muted">
            Taking you to sign in…
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <Card className="max-w-md w-full p-8">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">
          Set a new password
        </h1>
        <p className="text-sm text-muted mb-6">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              autoFocus
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
