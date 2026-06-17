import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button, Card } from "@/components/ui";

export function JoinGate({
  courseTitle,
  courseCode,
  slug,
}: {
  courseTitle: string;
  courseCode: string | null;
  slug: string;
}) {
  const redirectTo = encodeURIComponent(`/join/${slug}`);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-brass-dark mb-3">
            Course invitation
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            {courseTitle}
          </h1>
          {courseCode && (
            <p className="font-mono text-xs text-muted mb-6">{courseCode}</p>
          )}
          <p className="text-sm text-muted mb-6">
            Sign in or create a student account to request a seat in this
            course.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/signup?redirectTo=${redirectTo}`}>
              <Button className="w-full">Create an account</Button>
            </Link>
            <Link href={`/login?redirectTo=${redirectTo}`}>
              <Button variant="secondary" className="w-full">
                I already have an account
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}
