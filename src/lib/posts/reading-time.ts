import { READING_TIME } from "@/config/constants";

import { htmlToPlainText } from "./sanitize";

/** Estimated reading time in whole minutes, minimum 1 (plan 6). */
export function readingMinutesFromHtml(html: string): number {
  const text = htmlToPlainText(html);
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / READING_TIME.wordsPerMinute));
}
