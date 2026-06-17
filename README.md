# Register — Attendance App for GE/OE Courses

A lightweight attendance system: faculty create courses, students request
enrollment, faculty approve and mark attendance per session, and everything
can sync to a linked Google Sheet.

## Stack
- **Next.js 16** (App Router) — hosted free on **Vercel**
- **Supabase** — Postgres database, auth, and row-level security (free tier)
- **Google Sheets API** — via a service account, for roster import / attendance export

---

## 1. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) -> New project. Pick any name/region, set a database password (save it somewhere).
2. Once the project is ready, go to **SQL Editor** -> **New query**.
3. Open `supabase/schema.sql` from this repo, paste the entire contents, and click **Run**. This creates all tables, types, indexes, and security policies in one go.
4. Go to **Authentication -> Providers** and confirm **Email** is enabled (it is by default).
5. Go to **Authentication -> Settings** and **turn off "Confirm email"** for now, so you can test signups instantly without setting up an email sender. You can turn it back on later if you configure SMTP.
6. Go to **Project Settings -> API**. Copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Set up the Google service account (for Sheets sync)

This lets the app read/write any Google Sheet that's been shared as
"Anyone with the link can edit" — no per-faculty Google login needed.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) -> create a new project (or reuse one).
2. Enable the **Google Sheets API**: search "Google Sheets API" in the top search bar -> Enable.
3. Go to **IAM & Admin -> Service Accounts** -> **Create Service Account**. Name it anything (e.g. `attendance-sheets-bot`). No roles needed — skip that step.
4. Click into the created service account -> **Keys** tab -> **Add Key -> Create new key -> JSON**. This downloads a `.json` file.
5. Open that JSON file. You need two values:
   - `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` -> `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (keep the `\n` characters exactly as they appear in the file — don't reformat it)

**Important:** faculty must share their Google Sheet with **"Anyone with the link can edit"** (via the Sheet's Share button), since the service account doesn't have a personal Google identity faculty can grant access to directly. Mention this to faculty when they link a sheet.

---

## 3. Deploy to Vercel (free)

1. Push this project to a GitHub repo (Vercel deploys from Git).
2. Go to [vercel.com](https://vercel.com) -> **Add New -> Project** -> import your repo.
3. In the **Environment Variables** section during setup, add all four:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (paste the whole multi-line key — Vercel's env var field supports newlines fine; if it strips them, wrap the value in quotes with literal `\n`)
4. Click **Deploy**. You'll get a `https://your-app.vercel.app` URL.

That's it — no servers to manage, both Vercel and Supabase free tiers are enough for a single GE/OE course's worth of traffic (dozens to low hundreds of students).

---

## 4. Approving faculty accounts

Faculty signups land in a **pending** state and can't sign in until approved.
Since there's no separate admin panel built (kept deliberately simple), approve them directly in Supabase:

1. Go to **Supabase -> Table Editor -> profiles**.
2. Find the faculty row by email, set `is_approved` to `true`, save.

If you expect to approve faculty often, this is the one piece worth automating later.

---

## 5. Using the app

**Faculty:**
1. Sign up, choosing "Faculty" — wait for approval (see above).
2. Sign in -> **New course** -> give it a title (e.g. "Digital Marketing").
3. Copy the join link shown on the course page and share it with students (WhatsApp group, email, LMS announcement, etc).
4. Approve enrollment requests as they come in, under the **Roster** tab.
5. Under **Sessions**, click **New session** each time you want to take attendance, then tap each student to mark present/absent and **Save**.
6. Under **Settings**, optionally paste a Google Sheet URL to import a roster (from a tab named `Roster` with columns Name/Email/Program/Enrollment No) or export attendance (writes a tab named `Attendance Export`).

**Students:**
1. Open the join link the faculty shares.
2. Sign up (or sign in) as a Student, then tap **Request to join**.
3. Wait for faculty approval — check your dashboard.
4. Once approved, view your own attendance record under the course.

---

## Notes on the design

- Each faculty member's courses, rosters, and attendance are fully isolated via Postgres row-level security — one faculty member can never query another's data, even through the API.
- Students only ever see their own attendance record, never anyone else's.
- The Google Sheet integration is intentionally simple (no per-user OAuth) — it trades a bit of security (anyone with the sheet link could edit it) for much less setup. If this becomes a real concern, the natural upgrade is per-faculty Google OAuth, which would need a bit more plumbing (refresh tokens stored per faculty row).
