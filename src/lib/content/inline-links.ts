/**
 * Inline markup for copy stored in content modules:
 * - links: `[label](/route)` or `[label](https://…)`
 * - bold: `**text**`
 *
 * Parsing lives here (pure, unit-tested); rendering happens in
 * `ContentSections` / `FaqSection`.
 */

export type InlineToken =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string };

const INLINE_RE = /\[([^\]]+)\]\(([^()\s]+)\)|\*\*([^*]+)\*\*/g;

/** External and app-internal (absolute-path) links only — no javascript: or relative junk. */
function isSafeHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
}

export function parseInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(INLINE_RE)) {
    const index = match.index ?? 0;
    const [full, label, href, bold] = match;

    if (index > lastIndex) {
      tokens.push({ type: "text", text: input.slice(lastIndex, index) });
    }

    if (label !== undefined && href !== undefined && isSafeHref(href)) {
      tokens.push({ type: "link", text: label, href });
    } else if (bold !== undefined) {
      tokens.push({ type: "strong", text: bold });
    } else {
      // Unsafe href or malformed match: keep the source text as-is.
      tokens.push({ type: "text", text: full });
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: "text", text: input.slice(lastIndex) });
  }

  return tokens;
}

/** Flatten to plain text (used by `meta` descriptions and tests). */
export function inlineToText(input: string): string {
  return parseInline(input)
    .map((token) => token.text)
    .join("");
}
