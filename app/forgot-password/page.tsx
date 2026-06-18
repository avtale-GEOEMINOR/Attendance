"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink mb-3">
            Check your email
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            If an account exists for <span className="text-ink">{email}</span>,
            a password reset link is on its way. It can take a minute or two
            to arrive — check your spam folder if you don&apos;t see it.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <Card className="max-w-md w-full p-8">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">
          Reset your password
        </h1>
        <p className="text-sm text-muted mb-6">
          Enter the email you signed up with and we&apos;ll send you a reset
          link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@college.edu"
            />
          </div>

          {error && (
            <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          <Link href="/login" className="text-brass-dark font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
