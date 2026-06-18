import { customAlphabet } from "nanoid";

const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
const generate = customAlphabet(alphabet, 8);

/** Generates a short, URL-safe, unambiguous join code for a course. */
export function generateJoinSlug(): string {
  return generate();
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Generates a faculty short code from their name — first 3 letters of their
 * first name, uppercased. E.g. "Avtale Tale" -> "AVT".
 */
export function generateFacultyCode(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] ?? "";
  const letters = firstName.replace(/[^a-zA-Z]/g, "");
  return (letters.slice(0, 3) || "FAC").toUpperCase();
}

/**
 * Generates a course short code from its title — initials of each word.
 * E.g. "Digital Marketing" -> "DM". Single-word titles use the first 2-3 letters.
 */
export function generateCourseCode(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CRS";

  if (words.length === 1) {
    const letters = words[0].replace(/[^a-zA-Z]/g, "");
    return (letters.slice(0, 3) || "CRS").toUpperCase();
  }

  const initials = words
    .map((w) => w.replace(/[^a-zA-Z]/g, "")[0] ?? "")
    .join("")
    .toUpperCase();
  return initials || "CRS";
}

/**
 * Generates a readable join code for a course, e.g. "DM2026" — course
 * initials plus the current year. If that's taken, the caller should retry
 * with a numeric suffix (handled at the call site since it needs a DB check).
 */
export function generateJoinCode(courseCode: string, suffix?: number): string {
  const year = new Date().getFullYear();
  return suffix ? `${courseCode}${year}${suffix}` : `${courseCode}${year}`;
}

/** Builds a per-course roll number, e.g. "AVT_DM_001". */
export function buildRollNumber(
  facultyCode: string,
  courseCode: string,
  sequence: number
): string {
  const padded = String(sequence).padStart(3, "0");
  return `${facultyCode}_${courseCode}_${padded}`;
}

/**
 * Formats a plain YYYY-MM-DD date string for display, parsing it as a local
 * date rather than UTC midnight — avoids the date shifting back a day in
 * timezones ahead of UTC (e.g. India) when using `new Date(dateStr)` directly.
 */
export function formatSessionDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-IN", options);
}
