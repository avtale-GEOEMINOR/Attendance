import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttendanceSheet } from "./attendance-sheet";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createClient();

  const [{ data: { user } }, { data: course }, { data: session }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase.from("courses").select("*").eq("id", id).single(),
      supabase.from("sessions").select("*").eq("id", sessionId).single(),
    ]);

  if (!course) notFound();
  if (course.faculty_id !== user!.id) redirect("/faculty");
  if (!session || session.course_id !== id) notFound();

  const [{ data: enrollments }, { data: existingRecords }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, profiles(*)")
      .eq("course_id", id)
      .eq("status", "approved")
      .order("requested_at", { ascending: true }),
    supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", sessionId),
  ]);

  const recordMap = (existingRecords ?? []).reduce((acc, r) => {
    acc[r.student_id] = r.status;
    return acc;
  }, {} as Record<string, "present" | "absent">);

  return (
    <AttendanceSheet
      course={course}
      session={session}
      students={enrollments ?? []}
      initialRecords={recordMap}
    />
  );
}
