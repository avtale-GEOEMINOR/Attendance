"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui";
import { cn, generateFacultyCode } from "@/lib/utils";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const supabase = createClient();

  const [role, setRole] = useState<"student" | "faculty">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [program, setProgram] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [facultyCodeOverride, setFacultyCodeOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-suggest a faculty code from the name unless the user typed their
  // own — computed directly during render, no effect needed since this is
  // pure derived state from `fullName` and `facultyCodeOverride`.
  const facultyCode =
    facultyCodeOverride ?? (fullName ? generateFacultyCode(fullName) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Something went wrong creating your account. Try again.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      program: role === "student" ? program || null : null,
      enrollment_no: role === "student" ? enrollmentNo || null : null,
      faculty_code:
        role === "faculty"
          ? (facultyCode || generateFacultyCode(fullName)).toUpperCase()
          : null,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (role === "faculty") {
      setSuccess(true);
      return;
    }

    // If email confirmation is required, there's no session yet — send
    // the student to login (preserving redirectTo) instead of the dashboard.
    if (!data.session) {
      router.push(
        `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`
      );
      return;
    }

    router.push(redirectTo ?? "/student");
    router.refresh();
  }

  if (success) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink mb-3">
            Request received
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Your faculty account needs approval before you can sign in. This
            is a manual step to confirm you&apos;re teaching staff — you&apos;ll
            be notified once it&apos;s approved.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Go to sign in
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
          Create an account
        </h1>
        <p className="text-sm text-muted mb-6">
          Sign up as a student or faculty member.
        </p>

        <div className="flex rounded-sm border border-line mb-6 overflow-hidden">
          {(["student", "faculty"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium capitalize transition-colors",
                role === r
                  ? "bg-ink text-parchment"
                  : "bg-paper text-muted hover:text-ink"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {role === "student" && (
            <>
              <div>
                <Label htmlFor="program">Program (optional)</Label>
                <Input
                  id="program"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. B.Tech CSE"
                />
              </div>
              <div>
                <Label htmlFor="enrollmentNo">Enrollment number (optional)</Label>
                <Input
                  id="enrollmentNo"
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                  placeholder="e.g. 2023BCS045"
                />
              </div>
            </>
          )}

          {role === "faculty" && (
            <>
              <div>
                <Label htmlFor="facultyCode">
                  Your short code (used in student roll numbers)
                </Label>
                <Input
                  id="facultyCode"
                  value={facultyCode}
                  onChange={(e) => {
                    setFacultyCodeOverride(e.target.value.toUpperCase());
                  }}
                  placeholder="e.g. AVT"
                  maxLength={6}
                />
                <p className="text-xs text-muted mt-1.5">
                  Auto-filled from your name — edit if you&apos;d like something
                  different.
                </p>
              </div>
              <p className="text-xs text-muted bg-brass/5 border border-brass/20 rounded-sm px-3 py-2.5">
                Faculty accounts require approval before you can sign in.
              </p>
            </>
          )}

          {error && (
            <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-brass-dark font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
