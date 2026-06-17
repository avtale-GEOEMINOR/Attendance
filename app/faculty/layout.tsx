import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_approved, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "faculty") {
    redirect("/student");
  }

  if (!profile.is_approved) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="font-display text-2xl font-semibold text-ink mb-3">
              Pending approval
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Your faculty account is still awaiting approval. You&apos;ll be
              able to create courses once an administrator confirms your
              account.
            </p>
          </div>
        </main>
      </>
    );
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <>
      <SiteHeader userLabel={profile.full_name} signOutAction={signOut} />
      {children}
    </>
  );
}
