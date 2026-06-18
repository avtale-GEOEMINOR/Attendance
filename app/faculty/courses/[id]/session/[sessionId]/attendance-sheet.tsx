"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";
import { cn, formatSessionDate } from "@/lib/utils";
import type { Course, Enrollment, Session, AttendanceStatus } from "@/lib/types";

export function AttendanceSheet({
  course,
  session,
  students,
  initialRecords,
}: {
  course: Course;
  session: Session;
  students: Enrollment[];
  initialRecords: Record<string, AttendanceStatus>;
}) {
  const supabase = createClient();

  // Default everyone to absent unless already marked present
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(
    () => {
      const base: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        base[s.student_id] = initialRecords[s.student_id] ?? "absent";
      });
      return base;
    }
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function toggle(studentId: string) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }

  function markAll(status: AttendanceStatus) {
    setRecords((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        next[s.student_id] = status;
      });
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const rows = students.map((s) => ({
      session_id: session.id,
      student_id: s.student_id,
      status: records[s.student_id],
    }));

    const { error } = await supabase
      .from("attendance_records")
      .upsert(rows, { onConflict: "session_id,student_id" });

    setSaving(false);
    if (!error) {
      setSavedAt(new Date().toLocaleTimeString());
    }
  }

  const presentCount = Object.values(records).filter((r) => r === "present").length;

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
      <Link
        href={`/faculty/courses/${course.id}`}
        className="text-xs text-muted hover:text-ink"
      >
        ← {course.title}
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {formatSessionDate(session.session_date, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h1>
          <p className="text-sm text-muted mt-1">
            {presentCount} of {students.length} marked present
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => markAll("present")} className="!py-1.5 !px-3 text-xs">
            Mark all present
          </Button>
          <Button variant="secondary" onClick={() => markAll("absent")} className="!py-1.5 !px-3 text-xs">
            Mark all absent
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted">
            No approved students enrolled yet.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {students.map((s, i) => {
            const status = records[s.student_id];
            const isPresent = status === "present";
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.student_id)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
                  i !== students.length - 1 && "ledger-rule",
                  isPresent ? "bg-sage/5" : "bg-transparent hover:bg-ink/[0.02]"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted w-6">
                    {i + 1}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {s.profiles?.full_name}
                    </p>
                    <p className="text-xs text-muted">
                      {s.profiles?.enrollment_no ?? s.profiles?.email}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-sm tally-mark",
                    isPresent ? "bg-sage text-white" : "bg-rose/10 text-rose"
                  )}
                >
                  {isPresent ? "Present" : "Absent"}
                </span>
              </button>
            );
          })}
        </Card>
      )}

      <div className="flex items-center gap-4 mt-6">
        <Button onClick={save} disabled={saving || students.length === 0}>
          {saving ? "Saving…" : "Save attendance"}
        </Button>
        {savedAt && (
          <span className="text-xs text-sage">Saved at {savedAt}</span>
        )}
      </div>
    </main>
  );
}
