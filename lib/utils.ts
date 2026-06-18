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
