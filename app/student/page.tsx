import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import type { Course, EnrollmentStatus } from "@/lib/types";

interface EnrollmentWithCourse {
  id: string;
  status: EnrollmentStatus;
  courses: Course;
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, courses(*)")
    .eq("student_id", user!.id)
    .order("requested_at", { ascending: false })
    .overrideTypes<EnrollmentWithCourse[]>();

  const approved = (enrollments ?? []).filter((e) => e.status === "approved");
  const pending = (enrollments ?? []).filter((e) => e.status === "pending");

  return (
    <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">
        Your courses
      </h1>
      <p className="text-sm text-muted mb-8">
        Use the link your faculty shares to request enrollment in a new course.
      </p>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ink mb-3">
            Awaiting approval
          </h2>
          <div className="space-y-2">
            {pending.map((e) => (
              <Card key={e.id} className="p-4 flex items-center justify-between">
                <span className="text-sm text-ink">{e.courses?.title}</span>
                <Badge variant="warning">Pending</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}

      {approved.length === 0 && pending.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted">
            You&apos;re not enrolled in any courses yet. Ask your faculty
            member for the course link.
          </p>
        </Card>
      ) : (
        approved.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">Enrolled</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {approved.map((e) => (
                <Link key={e.id} href={`/student/courses/${e.courses.id}`}>
                  <Card className="p-6 h-full hover:border-brass/50 transition-colors">
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {e.courses?.title}
                    </h3>
                    {e.courses?.code && (
                      <p className="font-mono text-xs text-muted mt-1">
                        {e.courses.code}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )
      )}
    </main>
  );
}
