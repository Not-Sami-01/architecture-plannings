import type { JsonLdNode } from "@/lib/seo/schema";

type JsonLdProps = {
  data: JsonLdNode | readonly JsonLdNode[];
};

/** Structured data script tag (CONTENT.md §6). Never renders user input. */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
