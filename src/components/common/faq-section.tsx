import type { FaqItem } from "@/content/types";
import { faqSchema } from "@/lib/seo/schema";
import { InlineText } from "@/components/common/inline-text";
import { JsonLd } from "@/components/common/json-ld";

type FaqSectionProps = {
  items: readonly FaqItem[];
  heading?: string;
  id?: string;
  /** Include FAQPage structured data (default true). */
  schema?: boolean;
  className?: string;
};

/** FAQ list + FAQPage JSON-LD. Every public page should include one (CONTENT.md §3). */
export function FaqSection({
  items,
  heading = "Frequently asked questions",
  id = "faq",
  schema = true,
  className,
}: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="text-2xl font-semibold tracking-tight">
        {heading}
      </h2>
      <div className="mt-6 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.question} className="rounded-xl border bg-card p-5">
            <p className="font-medium">{item.question}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <InlineText text={item.answer} />
            </p>
          </div>
        ))}
      </div>
      {schema ? <JsonLd data={faqSchema(items)} /> : null}
    </section>
  );
}
