import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "admin_session";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

  if (!adminPassword || sessionCookie !== adminPassword) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { profileId } = await req.json();
  if (!profileId) {
    return NextResponse.json({ error: "Missing profileId." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", profileId)
    .eq("role", "faculty");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
