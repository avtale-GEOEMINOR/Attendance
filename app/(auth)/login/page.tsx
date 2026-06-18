"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_approved")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      setError("No profile found for this account.");
      setLoading(false);
      return;
    }

    if (profile.role === "faculty" && !profile.is_approved) {
      await supabase.auth.signOut();
      setError(
        "Your faculty account is still pending approval. Please check back later."
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo ?? (profile.role === "faculty" ? "/faculty" : "/student"));
    router.refresh();
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <Card className="max-w-md w-full p-8">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">
          Sign in
        </h1>
        <p className="text-sm text-muted mb-6">
          Welcome back. Enter your details to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@college.edu"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="password" className="!mb-0">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-brass-dark hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          New here?{" "}
          <Link href="/signup" className="text-brass-dark font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
