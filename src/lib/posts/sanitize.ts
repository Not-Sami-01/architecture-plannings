import sanitizeHtml from "sanitize-html";

/**
 * Stored blog HTML (plan 6). TipTap emits semantic markup; this allowlist is
 * the single choke point for what reaches the database AND the public render
 * (defense in depth: sanitize on write, again on read before rendering).
 */

const ALLOWED_SRC_PREFIXES = ["/api/posts/images/"];

function allowImageSrc(_tagName: string, attribs: Record<string, string>): {
  tagName: string;
  attribs: Record<string, string>;
} {
  const src = attribs.src ?? "";
  const allowed = ALLOWED_SRC_PREFIXES.some((prefix) => src.startsWith(prefix));
  return {
    tagName: "img",
    // width/height prevent layout shift; loading/decoding are progressive.
    attribs: allowed
      ? {
          src,
          alt: attribs.alt ?? "",
          ...(attribs.width ? { width: attribs.width } : {}),
          ...(attribs.height ? { height: attribs.height } : {}),
          loading: "lazy",
          decoding: "async",
        }
      : { alt: attribs.alt ?? "" },
  };
}

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: external
            ? { ...attribs, rel: "noopener noreferrer", target: "_blank" }
            : attribs,
        };
      },
      img: allowImageSrc,
    },
    // Everything not allowlisted (script, style, iframe, on* handlers…) is dropped.
    disallowedTagsMode: "discard",
  });
}

/** Plain text of a post (reading time, previews) — strips every tag. */
export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
