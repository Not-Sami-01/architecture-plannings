import Link from "next/link";

import { homePlotSize } from "@/content/home";
import { InlineText } from "@/components/common/inline-text";

/** Plot-size chip links (home page). */
export function PlotSizeChips() {
  return (
    <div className="mt-8">
      <ul className="flex flex-wrap gap-2">
        {homePlotSize.chips.map((chip) => (
          <li key={chip.label}>
            <Link
              href={chip.href}
              className="inline-flex min-h-11 items-center rounded-full border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted-foreground">
        <InlineText text={homePlotSize.note} />
      </p>
    </div>
  );
}
