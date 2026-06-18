import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPanel } from "./admin-panel";

// Always fetch fresh — this page lists pending approvals and must never be
// cached or prerendered with stale data.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createAdminClient();

  const { data: pendingFaculty } = await supabase
    .from("profiles")
    .select("id, full_name, email, faculty_code, created_at")
    .eq("role", "faculty")
    .eq("is_approved", false)
    .order("created_at", { ascending: true });

  const { data: approvedFaculty } = await supabase
    .from("profiles")
    .select("id, full_name, email, faculty_code, created_at")
    .eq("role", "faculty")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return (
    <AdminPanel
      pendingFaculty={pendingFaculty ?? []}
      approvedFaculty={approvedFaculty ?? []}
    />
  );
}
