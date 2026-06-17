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

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, code")
    .eq("join_slug", slug)
    .single();

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
