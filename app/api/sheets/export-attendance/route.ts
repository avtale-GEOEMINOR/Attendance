import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSheetId, writeAttendanceSheet } from "@/lib/google/sheets";

/**
 * Exports the full attendance matrix (students x sessions) to a tab named
 * "Attendance Export" in the linked Google Sheet. Overwrites that tab each
 * time it's run.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { courseId } = await req.json();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course || course.faculty_id !== user.id) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (!course.sheet_url) {
    return NextResponse.json({ error: "No sheet linked to this course" }, { status: 400 });
  }

  const sheetId = extractSheetId(course.sheet_url);
  if (!sheetId) {
    return NextResponse.json({ error: "Invalid Google Sheet URL" }, { status: 400 });
  }

  interface EnrollmentWithProfile {
    student_id: string;
    roll_number: string | null;
    profiles: {
      full_name: string | null;
      email: string | null;
      roll_no: string | null;
      year: string | null;
      program: string | null;
    };
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, roll_number, profiles(full_name, email, roll_no, year, program)")
    .eq("course_id", courseId)
    .eq("status", "approved")
    .overrideTypes<EnrollmentWithProfile[]>();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("course_id", courseId)
    .order("session_date", { ascending: true });

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ error: "No sessions to export" }, { status: 400 });
  }

  const sessionIds = sessions.map((s) => s.id);
  const { data: records } = await supabase
    .from("attendance_records")
    .select("session_id, student_id, status")
    .in("session_id", sessionIds);

  const recordMap = new Map<string, string>();
  (records ?? []).forEach((r) => {
    recordMap.set(`${r.session_id}:${r.student_id}`, r.status);
  });

  const header = [
    "Roll Number",
    "Name",
    "Year",
    "Program",
    "Roll No (College)",
    "Email",
    ...sessions.map((s) => s.session_date),
    "Present",
    "Total",
    "Percentage",
  ];

  const rows: (string | number)[][] = [header];

  for (const e of enrollments ?? []) {
    const profile = e.profiles;
    const attendanceCells = sessions.map((s) => {
      const status = recordMap.get(`${s.id}:${e.student_id}`);
      return status === "present" ? "P" : "A";
    });
    const presentCount = attendanceCells.filter((c) => c === "P").length;
    const pct = Math.round((presentCount / sessions.length) * 100);

    rows.push([
      e.roll_number ?? "",
      profile?.full_name ?? "",
      profile?.year ?? "",
      profile?.program ?? "",
      profile?.roll_no ?? "",
      profile?.email ?? "",
      ...attendanceCells,
      presentCount,
      sessions.length,
      `${pct}%`,
    ]);
  }

  try {
    await writeAttendanceSheet(sheetId, "Attendance Export", rows);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not write to sheet. Make sure it's shared as "Anyone with the link can edit." (${(err as Error).message})` },
      { status: 400 }
    );
  }

  return NextResponse.json({ sessionsExported: sessions.length });
}
