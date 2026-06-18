"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";

interface FacultyRow {
  id: string;
  full_name: string;
  email: string;
  faculty_code: string | null;
  created_at: string;
}

export function AdminPanel({
  pendingFaculty,
  approvedFaculty,
}: {
  pendingFaculty: FacultyRow[];
  approvedFaculty: FacultyRow[];
}) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setProcessingId(id);
    setError(null);
    const res = await fetch("/api/admin/approve-faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id }),
    });
    setProcessingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not approve this account.");
      return;
    }

    router.refresh();
  }

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Faculty approvals
          </h1>
          <p className="text-sm text-muted mt-1">
            Approve faculty signups so they can create courses.
          </p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-muted hover:text-ink"
        >
          Sign out
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose bg-rose/5 border border-rose/20 rounded-sm px-3 py-2.5 mb-6">
          {error}
        </p>
      )}

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-ink mb-3">
          Pending ({pendingFaculty.length})
        </h2>
        {pendingFaculty.length === 0 ? (
          <p className="text-sm text-muted">No pending faculty accounts.</p>
        ) : (
          <div className="space-y-2">
            {pendingFaculty.map((f) => (
              <Card key={f.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{f.full_name}</p>
                  <p className="text-xs text-muted">
                    {f.email}
                    {f.faculty_code ? ` · code: ${f.faculty_code}` : ""}
                  </p>
                </div>
                <Button
                  onClick={() => approve(f.id)}
                  disabled={processingId === f.id}
                  className="!py-1.5 !px-3 text-xs"
                >
                  {processingId === f.id ? "Approving…" : "Approve"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">
          Approved ({approvedFaculty.length})
        </h2>
        {approvedFaculty.length === 0 ? (
          <p className="text-sm text-muted">No approved faculty yet.</p>
        ) : (
          <div className="space-y-2">
            {approvedFaculty.map((f) => (
              <Card key={f.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{f.full_name}</p>
                  <p className="text-xs text-muted">
                    {f.email}
                    {f.faculty_code ? ` · code: ${f.faculty_code}` : ""}
                  </p>
                </div>
                <Badge variant="success">Approved</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
