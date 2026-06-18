"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateJoinSlug, generateCourseCode, generateJoinCode } from "@/lib/utils";
import { Button, Input, Label, Card } from "@/components/ui";

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [courseCodeOverride, setCourseCodeOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-suggest a course code from the title unless the user typed their
  // own — pure derived value computed during render, no effect needed.
  const courseCode =
    courseCodeOverride ?? (title ? generateCourseCode(title) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const finalCourseCode = (courseCode || generateCourseCode(title)).toUpperCase();
    const joinSlug = generateJoinSlug();

    // Try a readable join code, retrying with a numeric suffix on collision
    // (rare, but two faculty could both teach "Digital Marketing" the same year).
    let insertResult = null;
    let insertError = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const joinCode = generateJoinCode(finalCourseCode, attempt > 0 ? attempt + 1 : undefined);

      const { data, error } = await supabase
        .from("courses")
        .insert({
          faculty_id: user.id,
          title,
          code: code || null,
          course_code: finalCourseCode,
          join_slug: joinSlug,
          join_code: joinCode,
        })
        .select()
        .single();

      if (!error) {
        insertResult = data;
        break;
      }

      // 23505 = unique violation — only retry on that, anything else is a real error.
      if (error.code !== "23505") {
        insertError = error;
        break;
      }
      insertError = error;
    }

    if (!insertResult) {
      setError(insertError?.message ?? "Could not create course. Try again.");
      setLoading(false);
      return;
    }

    router.push(`/faculty/courses/${insertResult.id}`);
    router.refresh();
  }

  return (
    <main className="flex-1 mx-auto max-w-md w-full px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">
        New course
      </h1>
      <p className="text-sm text-muted mb-6">
        You&apos;ll get a shareable join code right after this.
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Course title</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Digital Marketing"
            />
          </div>
          <div>
            <Label htmlFor="courseCode">
              Short code (used in join code &amp; roll numbers)
            </Label>
            <Input
              id="courseCode"
              value={courseCode}
              onChange={(e) => {
                setCourseCodeOverride(e.target.value.toUpperCase());
              }}
              placeholder="e.g. DM"
              maxLength={6}
            />
            <p className="text-xs text-muted mt-1.5">
              Auto-filled from the title — edit if you&apos;d like something
              different.
            </p>
          </div>
          <div>
            <Label htmlFor="code">Official course code (optional)</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. GE-OE-204"
            />
          </div>

          {error && (
            <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create course"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
