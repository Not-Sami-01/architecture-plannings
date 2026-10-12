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

/** FAQ as hairline-ruled rows + FAQPage JSON-LD. Every public page should include one (CONTENT.md §3). */
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
      <h2 id={id} className="font-display font-medium text-3xl leading-tight tracking-tight md:text-4xl">
        {heading}
      </h2>
      <dl className="mt-8 border-t">
        {items.map((item) => (
          <div key={item.question} className="border-b py-5">
            <dt className="font-medium">{item.question}</dt>
            <dd className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              <InlineText text={item.answer} />
            </dd>
          </div>
        ))}
      </dl>
      {schema ? <JsonLd data={faqSchema(items)} /> : null}
    </section>
  );
}
