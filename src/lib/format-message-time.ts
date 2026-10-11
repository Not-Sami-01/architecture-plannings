/**
 * Chat timestamp formatting (plan 2 P3). Pure and locale-stable so it can be
 * unit-tested; the hover tooltip always carries the full parts.
 */
export type MessageTime = {
  /** Inline form: "just now" · "5 min ago" · "3 h ago" · "8 Oct". */
  short: string;
  /** Tooltip form: "8 Oct 2026, 14:32". */
  full: string;
};

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatMessageTime(value: string | Date, now: Date = new Date()): MessageTime {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);

  let short: string;
  if (diffMs < 60_000) {
    short = "just now";
  } else if (hours < 1) {
    short = `${minutes} min ago`;
  } else if (hours < 24) {
    short = `${hours} h ago`;
  } else {
    // Days get a plain date — "8 Oct" reads faster than "1 d ago".
    short = shortDate.format(date);
  }

  return { short, full: `${fullDate.format(date)}, ${clock.format(date)}` };
}
