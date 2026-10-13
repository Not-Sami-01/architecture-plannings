import { describe, expect, it } from "vitest";

import { htmlToPlainText, sanitizePostHtml } from "./sanitize";

describe("sanitizePostHtml", () => {
  it("keeps TipTap's semantic markup", () => {
    const html =
      '<h2>Heading</h2><p>Hello <strong>bold</strong> and <em>italic</em>.</p><ul><li>one</li></ul><blockquote><p>quote</p></blockquote><pre><code>code</code></pre>';
    expect(sanitizePostHtml(html)).toBe(html);
  });

  it("discards script/style/iframe and on* handlers", () => {
    const dirty =
      '<p onclick="alert(1)">hi</p><script>alert(2)</script><style>body{}</style><iframe src="https://evil.example"></iframe>';
    const clean = sanitizePostHtml(dirty);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("iframe");
    expect(clean).not.toContain("style");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("hi");
  });

  it("blocks javascript: URLs and non-allowlisted image sources", () => {
    const clean = sanitizePostHtml(
      '<a href="javascript:alert(1)">x</a><img src="https://evil.example/track.png" alt="t"><img src="/api/posts/images/file_1.jpg" alt="ok">',
    );
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("evil.example");
    expect(clean).toContain("/api/posts/images/file_1.jpg");
  });

  it("forces rel/target on external links but not internal ones", () => {
    const clean = sanitizePostHtml(
      '<a href="https://example.com">ext</a><a href="/services">int</a>',
    );
    expect(clean).toContain('<a href="https://example.com" rel="noopener noreferrer" target="_blank">');
    const internal = clean.split('<a href="/services">')[1] ?? "";
    expect(internal).not.toContain('target="_blank"');
    expect(internal).not.toContain("noopener");
  });
});

describe("htmlToPlainText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToPlainText("<h2>Title</h2><p>  Body   text </p>")).toBe("Title Body text");
  });
});
