/**
 * Shared shapes for marketing copy (CONTENT.md §9: copy lives in content files,
 * components only render what they are given).
 */

/** Front matter for one page. Rendered by `buildMetadata` in `src/lib/seo/metadata.ts`. */
export type SeoMeta = {
  /** Title without the brand suffix — the root layout appends "| ArchiPlan Studio". */
  title: string;
  description: string;
  /** Canonical path for this page, e.g. "/services". */
  path: string;
  /** Primary keyword first, then related keywords (CONTENT.md §2). */
  keywords?: readonly string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ContentLink = {
  label: string;
  href: string;
};

/** Breadcrumb trail; the last item is the current page (no href). */
export type Crumb = {
  label: string;
  href?: string;
};

/**
 * Structured copy blocks. Text fields may contain inline links written as
 * `[label](/route)` or `[label](https://…)` — parsed by `parseInlineLinks`.
 */
export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; id: string; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: readonly string[] }
  | { kind: "ol"; items: readonly string[] }
  | { kind: "steps"; items: readonly { title: string; text?: string }[] }
  | {
      kind: "table";
      head: readonly string[];
      rows: readonly (readonly string[])[];
      note?: string;
    }
  | { kind: "callout"; text: string }
  | { kind: "links"; items: readonly ContentLink[] };
