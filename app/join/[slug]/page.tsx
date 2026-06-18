import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinCard } from "./join-card";
import { JoinGate } from "./join-gate";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Try the new readable join_code first (case-insensitive — people will
  // type "dm2026" as often as "DM2026"), then fall back to the legacy
  // random join_slug for any links shared before this change.
  let course = (
    await supabase
      .from("courses")
      .select("id, title, code")
      .ilike("join_code", slug)
      .maybeSingle()
  ).data;

  if (!course) {
    course = (
      await supabase
        .from("courses")
        .select("id, title, code")
        .eq("join_slug", slug)
        .maybeSingle()
    ).data;
  }

  if (!course) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <JoinGate
        courseTitle={course.title}
        courseCode={course.code}
        slug={slug}
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    redirect("/faculty");
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("status")
    .eq("course_id", course.id)
    .eq("student_id", user.id)
    .maybeSingle();

  return (
    <JoinCard
      courseId={course.id}
      courseTitle={course.title}
      courseCode={course.code}
      existingStatus={existing?.status ?? null}
    />
  );
}
