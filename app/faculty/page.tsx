import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Badge } from "@/components/ui";

export default async function FacultyDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("faculty_id", user!.id)
    .order("created_at", { ascending: false });

  // Get pending enrollment counts per course
  const courseIds = courses?.map((c) => c.id) ?? [];
  let pendingCounts: Record<string, number> = {};

  if (courseIds.length > 0) {
    const { data: pending } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "pending");

    pendingCounts = (pending ?? []).reduce((acc, row) => {
      acc[row.course_id] = (acc[row.course_id] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  return (
    <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Your courses
          </h1>
          <p className="text-sm text-muted mt-1">
            Each course keeps its own roster and attendance register.
          </p>
        </div>
        <Link href="/faculty/courses/new">
          <Button>New course</Button>
        </Link>
      </div>

      {(!courses || courses.length === 0) ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted">
            You haven&apos;t created a course yet.
          </p>
          <Link href="/faculty/courses/new" className="inline-block mt-4">
            <Button variant="secondary">Create your first course</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((course) => (
            <Link key={course.id} href={`/faculty/courses/${course.id}`}>
              <Card className="p-6 h-full hover:border-brass/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {course.title}
                    </h2>
                    {course.code && (
                      <p className="font-mono text-xs text-muted mt-0.5">
                        {course.code}
                      </p>
                    )}
                  </div>
                  {pendingCounts[course.id] > 0 && (
                    <Badge variant="warning">
                      {pendingCounts[course.id]} pending
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
