import { describe, expect, it } from "vitest";

import { inlineToText, parseInline } from "./inline-links";

describe("parseInline", () => {
  it("returns a single text token when there is no markup", () => {
    expect(parseInline("Plain copy.")).toEqual([{ type: "text", text: "Plain copy." }]);
  });

  it("parses internal links", () => {
    expect(parseInline("See [pricing](/services).")).toEqual([
      { type: "text", text: "See " },
      { type: "link", text: "pricing", href: "/services" },
      { type: "text", text: "." },
    ]);
  });

  it("parses external links", () => {
    expect(parseInline("[WhatsApp](https://wa.me/92300)")).toEqual([
      { type: "link", text: "WhatsApp", href: "https://wa.me/92300" },
    ]);
  });

  it("parses bold text", () => {
    expect(parseInline("**Ground floor:** lounge")).toEqual([
      { type: "strong", text: "Ground floor:" },
      { type: "text", text: " lounge" },
    ]);
  });

  it("mixes links and bold in one string", () => {
    expect(parseInline("**Tip** and [a guide](/guides/x).")).toEqual([
      { type: "strong", text: "Tip" },
      { type: "text", text: " and " },
      { type: "link", text: "a guide", href: "/guides/x" },
      { type: "text", text: "." },
    ]);
  });

  it("keeps unsafe links as plain text", () => {
    expect(parseInline("[x](javascript:alert(1))")).toEqual([
      { type: "text", text: "[x](javascript:alert(1))" },
    ]);
  });

  it("keeps unmatched markup as plain text", () => {
    expect(parseInline("2 * 3 ** 4")).toEqual([{ type: "text", text: "2 * 3 ** 4" }]);
    expect(parseInline("[broken](link with spaces)")).toEqual([
      { type: "text", text: "[broken](link with spaces)" },
    ]);
  });
});

describe("inlineToText", () => {
  it("strips markup", () => {
    expect(inlineToText("**Tip** and [a guide](/guides/x).")).toBe("Tip and a guide.");
  });
});
