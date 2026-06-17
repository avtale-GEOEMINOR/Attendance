"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button, Card } from "@/components/ui";

export function JoinCard({
  courseId,
  courseTitle,
  courseCode,
  existingStatus,
}: {
  courseId: string;
  courseTitle: string;
  courseCode: string | null;
  existingStatus: "pending" | "approved" | "rejected" | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(existingStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestEnrollment() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("enrollments").insert({
      course_id: courseId,
      student_id: user.id,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setStatus("pending");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-brass-dark mb-3">
            Course invitation
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            {courseTitle}
          </h1>
          {courseCode && (
            <p className="font-mono text-xs text-muted mb-6">{courseCode}</p>
          )}

          {status === "approved" && (
            <>
              <p className="text-sm text-sage mb-6">
                You&apos;re already enrolled in this course.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push(`/student/courses/${courseId}`)}
              >
                Go to course
              </Button>
            </>
          )}

          {status === "pending" && (
            <p className="text-sm text-muted">
              Your request has been sent. The faculty member will approve it
              shortly — check back on your dashboard.
            </p>
          )}

          {status === "rejected" && (
            <p className="text-sm text-rose">
              Your previous request for this course was declined.
            </p>
          )}

          {status === null && (
            <>
              <p className="text-sm text-muted mb-6">
                Request a seat in this course. Your faculty member will need
                to approve you before you appear on the roster.
              </p>
              {error && (
                <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5 mb-4">
                  {error}
                </p>
              )}
              <Button className="w-full" onClick={requestEnrollment} disabled={loading}>
                {loading ? "Sending request…" : "Request to join"}
              </Button>
            </>
          )}
        </Card>
      </main>
    </>
  );
}
