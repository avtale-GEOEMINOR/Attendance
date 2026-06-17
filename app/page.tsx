import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-brass-dark mb-4">
            For GE / OE courses with mixed-program cohorts
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink leading-tight max-w-2xl">
            One register per course.
            <br />
            One row per student.
          </h1>
          <p className="text-base text-muted mt-5 max-w-lg leading-relaxed">
            Faculty open a course, students request a seat, and every session
            gets marked the way attendance always has — present or absent,
            kept in order. Export to Google Sheets whenever you need it.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/signup">
              <Button>Create an account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="ledger-rule mb-8" />
          <div className="grid sm:grid-cols-3 gap-6">
            <Card className="p-6">
              <span className="font-mono text-xs text-brass-dark">For faculty</span>
              <h3 className="font-display text-lg font-semibold text-ink mt-2 mb-2">
                Open a course
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Create a course, share one link, and approve students as
                requests come in. Each course is yours alone — nobody else
                sees your roster.
              </p>
            </Card>
            <Card className="p-6">
              <span className="font-mono text-xs text-brass-dark">For students</span>
              <h3 className="font-display text-lg font-semibold text-ink mt-2 mb-2">
                Request a seat
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Open the link your faculty shares, request enrollment, and
                check your own attendance record once you&apos;re approved.
              </p>
            </Card>
            <Card className="p-6">
              <span className="font-mono text-xs text-brass-dark">For records</span>
              <h3 className="font-display text-lg font-semibold text-ink mt-2 mb-2">
                Sync to Sheets
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Link a Google Sheet to import a roster or export attendance
                in one pass — no separate spreadsheet upkeep.
              </p>
            </Card>
          </div>
        </section>
      </main>
      <footer className="ledger-rule mx-auto max-w-5xl w-full px-6 py-6 text-xs text-muted">
        Register — a lightweight attendance tool for shared-elective courses.
      </footer>
    </>
  );
}
