/** Derives a URL slug from a title (lowercase kebab, capped at 80 chars). */
export function slugifyPost(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
