import Link from "next/link";

import { InlineText } from "@/components/common/inline-text";
import type { ContentBlock } from "@/content/types";

type ContentSectionsProps = {
  blocks: readonly ContentBlock[];
  className?: string;
};

/**
 * Renders long-form copy from content modules: headings, paragraphs, lists,
 * steps, tables and callouts (CONTENT.md §9 — components render, they do not
 * own, the copy).
 */
export function ContentSections({ blocks, className }: ContentSectionsProps) {
  return (
    <div className={className ?? "flex flex-col gap-4"}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2
                key={index}
                id={block.id}
                className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight first:mt-0"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} className="mt-6 text-lg font-semibold tracking-tight">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={index} className="leading-relaxed text-muted-foreground">
                <InlineText text={block.text} />
              </p>
            );
          case "ul":
            return (
              <ul key={index} className="flex flex-col gap-2 text-muted-foreground">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-2 leading-relaxed">
                    <span aria-hidden className="text-primary">
                      •
                    </span>
                    <span>
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index} className="flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="leading-relaxed">
                    <InlineText text={item} />
                  </li>
                ))}
              </ol>
            );
          case "steps":
            return (
              <ol key={index} className="flex flex-col gap-4">
                {block.items.map((step, stepIndex) => (
                  <li key={step.title} className="rounded-xl border bg-card p-5">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">
                        {stepIndex + 1}
                      </span>
                      {step.title}
                    </p>
                    {step.text ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        <InlineText text={step.text} />
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={index} className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {block.head.map((cell) => (
                        <th
                          key={cell}
                          scope="col"
                          className="px-4 py-3 text-left font-medium text-foreground"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 align-top text-muted-foreground">
                            <InlineText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {block.note ? (
                  <p className="border-t px-4 py-3 text-xs text-muted-foreground">{block.note}</p>
                ) : null}
              </div>
            );
          case "callout":
            return (
              <p
                key={index}
                className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground"
              >
                <InlineText text={block.text} />
              </p>
            );
          case "links":
            return (
              <ul key={index} className="flex flex-wrap gap-2">
                {block.items.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex rounded-full border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}
