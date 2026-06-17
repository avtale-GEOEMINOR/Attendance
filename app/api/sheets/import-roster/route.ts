import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSheetId, readSheetRows } from "@/lib/google/sheets";

/**
 * Imports a student roster from the "Roster" tab of a linked Google Sheet.
 * Expected columns (header row required): Name | Email | Program | Enrollment No
 *
 * For each row, if a matching student profile exists (by email), an
 * enrollment is created in "pending" status (faculty still needs to approve
 * via the normal roster UI) — UNLESS one already exists, in which case it's
 * left untouched. If no profile exists yet for that email, the row is
 * skipped and reported back so faculty know which students still need to
 * sign up themselves.
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

  let rows: string[][];
  try {
    rows = (await readSheetRows(sheetId, "Roster!A:D")) as string[][];
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read sheet. Make sure it has a "Roster" tab and is shared as "Anyone with the link can edit." (${(err as Error).message})` },
      { status: 400 }
    );
  }

  if (rows.length < 2) {
    return NextResponse.json({ error: "No data rows found in Roster tab" }, { status: 400 });
  }

  const [header, ...dataRows] = rows;
  const emailIdx = header.findIndex((h) => h.toLowerCase().includes("email"));

  if (emailIdx === -1) {
    return NextResponse.json(
      { error: "Roster tab must have an 'Email' column" },
      { status: 400 }
    );
  }

  let imported = 0;
  const skipped: string[] = [];

  for (const row of dataRows) {
    const email = row[emailIdx]?.trim().toLowerCase();
    if (!email) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("role", "student")
      .maybeSingle();

    if (!profile) {
      skipped.push(email);
      continue;
    }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("student_id", profile.id)
      .maybeSingle();

    if (existing) continue;

    const { error: insertError } = await supabase.from("enrollments").insert({
      course_id: courseId,
      student_id: profile.id,
      status: "pending",
    });

    if (!insertError) imported++;
  }

  return NextResponse.json({ imported, skipped });
}
