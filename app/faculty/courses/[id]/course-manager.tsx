"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Course, Enrollment, Session } from "@/lib/types";

type Tab = "roster" | "sessions" | "settings";

export function CourseManager({
  course,
  enrollments,
  sessions,
  attendanceSummary,
}: {
  course: Course;
  enrollments: Enrollment[];
  sessions: Session[];
  attendanceSummary: Record<string, { present: number; total: number }>;
}) {
  const [tab, setTab] = useState<Tab>("roster");
  const router = useRouter();
  const supabase = createClient();

  const pending = enrollments.filter((e) => e.status === "pending");
  const approved = enrollments.filter((e) => e.status === "approved");

  const [joinLinkCopied, setJoinLinkCopied] = useState(false);
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${course.join_slug}`
      : `/join/${course.join_slug}`;

  function copyJoinLink() {
    navigator.clipboard.writeText(joinUrl);
    setJoinLinkCopied(true);
    setTimeout(() => setJoinLinkCopied(false), 2000);
  }

  async function decideEnrollment(enrollmentId: string, status: "approved" | "rejected") {
    await supabase
      .from("enrollments")
      .update({ status, decided_at: new Date().toISOString() })
      .eq("id", enrollmentId);
    router.refresh();
  }

  async function createSession() {
    await supabase.from("sessions").insert({
      course_id: course.id,
      session_date: new Date().toISOString().slice(0, 10),
      label: null,
    });
    router.refresh();
  }

  return (
    <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
      <div className="mb-2">
        <Link href="/faculty" className="text-xs text-muted hover:text-ink">
          ← All courses
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {course.title}
          </h1>
          {course.code && (
            <p className="font-mono text-xs text-muted mt-1">{course.code}</p>
          )}
        </div>
        <Card className="px-4 py-3 shrink-0">
          <p className="text-xs text-muted mb-1">Share to enroll</p>
          <button
            onClick={copyJoinLink}
            className="font-mono text-xs text-brass-dark hover:underline"
          >
            {joinLinkCopied ? "Copied!" : joinUrl.replace(/^https?:\/\//, "")}
          </button>
        </Card>
      </div>

      <div className="flex gap-1 mb-6 ledger-rule">
        {(
          [
            ["roster", "Roster"],
            ["sessions", "Sessions"],
            ["settings", "Settings"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-brass text-ink"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {label}
            {key === "roster" && pending.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose text-white text-[10px]">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "roster" && (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink mb-3">
                Pending requests
              </h2>
              <div className="space-y-2">
                {pending.map((e) => (
                  <Card key={e.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {e.profiles?.full_name}
                      </p>
                      <p className="text-xs text-muted">
                        {e.profiles?.email}
                        {e.profiles?.program ? ` · ${e.profiles.program}` : ""}
                        {e.profiles?.enrollment_no ? ` · ${e.profiles.enrollment_no}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="!py-1.5 !px-3 text-xs"
                        onClick={() => decideEnrollment(e.id, "rejected")}
                      >
                        Decline
                      </Button>
                      <Button
                        className="!py-1.5 !px-3 text-xs"
                        onClick={() => decideEnrollment(e.id, "approved")}
                      >
                        Approve
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">
              Enrolled students ({approved.length})
            </h2>
            {approved.length === 0 ? (
              <p className="text-sm text-muted">
                No students enrolled yet. Share the join link above.
              </p>
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="ledger-rule text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Program</th>
                      <th className="px-4 py-3 font-medium text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approved.map((e) => {
                      const summary = attendanceSummary[e.student_id];
                      const pct =
                        summary && summary.total > 0
                          ? Math.round((summary.present / summary.total) * 100)
                          : null;
                      return (
                        <tr key={e.id} className="ledger-rule last:border-0">
                          <td className="px-4 py-3 text-ink font-medium">
                            {e.profiles?.full_name}
                          </td>
                          <td className="px-4 py-3 text-muted">{e.profiles?.email}</td>
                          <td className="px-4 py-3 text-muted">
                            {e.profiles?.program ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right tally-mark text-xs">
                            {summary ? (
                              <span
                                className={cn(
                                  pct !== null && pct < 75 ? "text-rose" : "text-sage"
                                )}
                              >
                                {summary.present}/{summary.total} ({pct}%)
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </section>
        </div>
      )}

      {tab === "sessions" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">
              Attendance sessions
            </h2>
            <Button onClick={createSession} className="!py-2 !px-3 text-xs">
              + New session (today)
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted">
                No sessions yet. Create one to start marking attendance.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <Link key={s.id} href={`/faculty/courses/${course.id}/session/${s.id}`}>
                  <Card className="p-4 flex items-center justify-between hover:border-brass/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {new Date(s.session_date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {s.label && (
                        <p className="text-xs text-muted mt-0.5">{s.label}</p>
                      )}
                    </div>
                    <span className="text-xs text-brass-dark">Mark attendance →</span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <SheetSettings course={course} approvedCount={approved.length} sessionsCount={sessions.length} />
      )}
    </main>
  );
}

function SheetSettings({
  course,
  approvedCount,
  sessionsCount,
}: {
  course: Course;
  approvedCount: number;
  sessionsCount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [sheetUrl, setSheetUrl] = useState(course.sheet_url ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function saveSheetUrl() {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("courses")
      .update({ sheet_url: sheetUrl || null })
      .eq("id", course.id);
    setSaving(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Saved.");
      router.refresh();
    }
  }

  async function importRoster() {
    setImporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sheets/import-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setMessage(`Imported ${data.imported} student(s). They still need approval.`);
      router.refresh();
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
    setImporting(false);
  }

  async function exportAttendance() {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sheets/export-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      setMessage(`Exported attendance for ${data.sessionsExported} session(s).`);
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
    setExporting(false);
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-ink mb-1">Google Sheet</h2>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Paste a Google Sheet link shared as &quot;Anyone with the link can
          edit.&quot; You can import a roster from a tab named{" "}
          <code className="font-mono">Roster</code> (columns: Name, Email,
          Program, Enrollment No) and export attendance to a new tab.
        </p>
        <Label htmlFor="sheetUrl">Sheet URL</Label>
        <Input
          id="sheetUrl"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
        <Button onClick={saveSheetUrl} disabled={saving} className="mt-3 !py-2 !px-3 text-xs">
          {saving ? "Saving…" : "Save sheet link"}
        </Button>
      </Card>

      {course.sheet_url && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-ink mb-4">Sync</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={importRoster}
              disabled={importing}
              className="!py-2 !px-3 text-xs"
            >
              {importing ? "Importing…" : "Import roster from Sheet"}
            </Button>
            <Button
              variant="secondary"
              onClick={exportAttendance}
              disabled={exporting || sessionsCount === 0}
              className="!py-2 !px-3 text-xs"
            >
              {exporting ? "Exporting…" : "Export attendance to Sheet"}
            </Button>
          </div>
          {sessionsCount === 0 && (
            <p className="text-xs text-muted mt-2">
              Create at least one session before exporting.
            </p>
          )}
        </Card>
      )}

      {message && (
        <p className="text-sm text-ink bg-ink/5 rounded-sm px-3 py-2.5">
          {message}
        </p>
      )}

      <p className="text-xs text-muted">
        {approvedCount} enrolled student(s) · {sessionsCount} session(s) recorded
      </p>
    </div>
  );
}
