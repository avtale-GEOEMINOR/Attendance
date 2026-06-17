"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateJoinSlug } from "@/lib/utils";
import { Button, Input, Label, Card } from "@/components/ui";

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const joinSlug = generateJoinSlug();

    const { data, error: insertError } = await supabase
      .from("courses")
      .insert({
        faculty_id: user.id,
        title,
        code: code || null,
        join_slug: joinSlug,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/faculty/courses/${data.id}`);
    router.refresh();
  }

  return (
    <main className="flex-1 mx-auto max-w-md w-full px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">
        New course
      </h1>
      <p className="text-sm text-muted mb-6">
        You&apos;ll get a shareable link right after this.
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
            <Label htmlFor="code">Course code (optional)</Label>
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
