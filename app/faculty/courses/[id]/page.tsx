import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseManager } from "./course-manager";

export default async function FacultyCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) notFound();
  if (course.faculty_id !== user!.id) redirect("/faculty");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, profiles(*)")
    .eq("course_id", id)
    .order("requested_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("course_id", id)
    .order("session_date", { ascending: false });

  // Attendance summary: total sessions, and per-student present counts
  const approvedStudents = (enrollments ?? []).filter(
    (e) => e.status === "approved"
  );

  let attendanceSummary: Record<string, { present: number; total: number }> = {};

  if (sessions && sessions.length > 0 && approvedStudents.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const { data: records } = await supabase
      .from("attendance_records")
      .select("session_id, student_id, status")
      .in("session_id", sessionIds);

    attendanceSummary = approvedStudents.reduce((acc, e) => {
      const presentCount = (records ?? []).filter(
        (r) => r.student_id === e.student_id && r.status === "present"
      ).length;
      acc[e.student_id] = { present: presentCount, total: sessions.length };
      return acc;
    }, {} as Record<string, { present: number; total: number }>);
  }

  return (
    <CourseManager
      course={course}
      enrollments={enrollments ?? []}
      sessions={sessions ?? []}
      attendanceSummary={attendanceSummary}
    />
  );
}
