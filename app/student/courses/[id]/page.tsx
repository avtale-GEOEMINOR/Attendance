import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { cn, formatSessionDate } from "@/lib/utils";
import type { Course } from "@/lib/types";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("course_id", id)
    .eq("student_id", user!.id)
    .single<{ status: string; courses: Course }>();

  if (!enrollment || enrollment.status !== "approved") {
    redirect("/student");
  }

  const course = enrollment.courses;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("course_id", id)
    .order("session_date", { ascending: false });

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", user!.id);

  const recordMap = (records ?? []).reduce((acc, r) => {
    acc[r.session_id] = r.status;
    return acc;
  }, {} as Record<string, "present" | "absent">);

  const totalSessions = sessions?.length ?? 0;
  const presentCount = (sessions ?? []).filter(
    (s) => recordMap[s.id] === "present"
  ).length;
  const pct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
      <Link href="/student" className="text-xs text-muted hover:text-ink">
        ← All courses
      </Link>

      <div className="flex items-end justify-between mt-2 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {course.title}
          </h1>
          {course.code && (
            <p className="font-mono text-xs text-muted mt-1">{course.code}</p>
          )}
        </div>
        {pct !== null && (
          <div className="text-right">
            <p
              className={cn(
                "tally-mark text-2xl font-semibold",
                pct < 75 ? "text-rose" : "text-sage"
              )}
            >
              {pct}%
            </p>
            <p className="text-xs text-muted">
              {presentCount} of {totalSessions} sessions
            </p>
          </div>
        )}
      </div>

      {(!sessions || sessions.length === 0) ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted">
            No sessions recorded yet for this course.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {sessions.map((s, i) => {
            const status = recordMap[s.id] ?? "absent";
            const isPresent = status === "present";
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between px-5 py-4",
                  i !== sessions.length - 1 && "ledger-rule"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {formatSessionDate(s.session_date)}
                  </p>
                  {s.label && (
                    <p className="text-xs text-muted mt-0.5">{s.label}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-sm tally-mark",
                    isPresent ? "bg-sage/10 text-sage" : "bg-rose/10 text-rose"
                  )}
                >
                  {isPresent ? "Present" : "Absent"}
                </span>
              </div>
            );
          })}
        </Card>
      )}
    </main>
  );
}
