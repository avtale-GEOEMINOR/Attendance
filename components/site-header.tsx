import Link from "next/link";

export function SiteHeader({
  userLabel,
  signOutAction,
}: {
  userLabel?: string;
  signOutAction?: () => void;
}) {
  return (
    <header className="ledger-rule-thick bg-parchment">
      <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold text-ink">
            Register
          </span>
          <span className="text-xs text-muted hidden sm:inline">
            attendance, kept properly
          </span>
        </Link>
        {userLabel && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted hidden sm:inline">
              {userLabel}
            </span>
            {signOutAction && (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-ink hover:text-brass-dark transition-colors"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
