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
4. **If you already ran schema.sql before** (i.e. you're updating an existing project): also open `supabase/migration_2_codes_and_rolls.sql`, paste it into a new SQL Editor query, and click **Run**. This adds the faculty/course short-code columns and roll-number support without touching any existing data.
5. Go to **Authentication -> Providers** and confirm **Email** is enabled (it is by default).
6. Go to **Authentication -> Settings** and **turn off "Confirm email"** for now, so you can test signups instantly without setting up an email sender. You can turn it back on later if you configure SMTP.
7. Go to **Project Settings -> API**. Copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** (or the legacy `anon` JWT key, under "Legacy API keys" if you're on a newer project) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (or the legacy `service_role` JWT key) -> `SUPABASE_SERVICE_ROLE_KEY` — **keep this one secret**, it bypasses all security rules and is only used server-side by the `/admin` pages.

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
3. In the **Environment Variables** section during setup, add all six:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (paste the whole multi-line key — Vercel's env var field supports newlines fine; if it strips them, wrap the value in quotes with literal `\n`)
   - `ADMIN_PASSWORD` (pick your own strong password — this protects the `/admin` faculty-approval page)
4. Click **Deploy**. You'll get a `https://your-app.vercel.app` URL.

That's it — no servers to manage, both Vercel and Supabase free tiers are enough for a single GE/OE course's worth of traffic (dozens to low hundreds of students).

---

## 4. Approving faculty accounts

Go to `https://your-app.vercel.app/admin`, enter the `ADMIN_PASSWORD` you set, and you'll see a list of pending faculty signups with an **Approve** button next to each. No need to touch Supabase directly anymore. Keep this URL and password to yourself — anyone with the password can approve faculty accounts.

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

## 6. Roll numbers, faculty codes, and join codes

Each faculty member gets a short code (e.g. "AVT", auto-suggested from their first name at signup, editable). Each course gets a short code too (e.g. "DM", auto-suggested from the title). When a student is approved into a course, they're automatically assigned a roll number combining both: `AVT_DM_001`, `AVT_DM_002`, and so on, counting up per course.

Courses also get a readable join code (e.g. "DM2026") instead of a random string — this is what's shown on the course page for faculty to read aloud or type into a join link, replacing the old long random link as the primary way to share a course (the old link format still works for backward compatibility).

If you have existing approved students from before this feature shipped, open their course's **Roster** tab — you'll see an **"Assign roll numbers"** button appear automatically whenever there are approved students missing one.

---

## Notes on the design

- Each faculty member's courses, rosters, and attendance are fully isolated via Postgres row-level security — one faculty member can never query another's data, even through the API.
- Students only ever see their own attendance record, never anyone else's.
- The Google Sheet integration is intentionally simple (no per-user OAuth) — it trades a bit of security (anyone with the sheet link could edit it) for much less setup. If this becomes a real concern, the natural upgrade is per-faculty Google OAuth, which would need a bit more plumbing (refresh tokens stored per faculty row).
