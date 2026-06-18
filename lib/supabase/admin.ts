import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key — bypasses Row
 * Level Security entirely. NEVER import this in client components or
 * expose SUPABASE_SERVICE_ROLE_KEY to the browser. Used only for the
 * password-protected /admin routes where there's no Supabase-authenticated
 * user to scope the request to.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role credentials are not configured on the server."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
