import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import type { Crumb } from "@/content/types";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/common/json-ld";

type BreadcrumbsProps = {
  items: readonly Crumb[];
};

/** Breadcrumb trail with BreadcrumbList structured data (CONTENT.md §5.7). */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
                ) : null}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-foreground" : undefined} aria-current={isLast ? "page" : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(items)} />
    </div>
  );
}
