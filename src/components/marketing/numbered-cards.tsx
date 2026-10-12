import { InlineText } from "@/components/common/inline-text";
import { cn } from "cn";

type NumberedCard = {
  title: string;
  text: string;
};

type NumberedCardsProps = {
  items: readonly NumberedCard[];
  /** Grid columns on large screens (default 5). */
  columns?: 3 | 5;
  /** Render on a near-black band (uses the hero ink tokens). */
  tone?: "light" | "dark";
  className?: string;
};

/** Numbered hairline grid — used for the home process section. */
export function NumberedCards({ items, columns = 5, tone = "light", className }: NumberedCardsProps) {
  const columnsClass = columns === 5 ? "lg:grid-cols-5" : "md:grid-cols-3";
  const dark = tone === "dark";

  return (
    <ol className={`grid gap-x-8 gap-y-8 sm:grid-cols-2 ${columnsClass} ${className ?? ""}`}>
      {items.map((item, index) => (
        <li key={item.title} className={cn("border-t pt-4", dark && "border-hero-ink/25")}>
          <span
            className={cn("font-mono text-xs", dark ? "text-hero-accent" : "text-accent-foreground")}
            aria-hidden
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className={cn("mt-3 font-display text-xl leading-snug", dark && "text-hero-ink")}>
            {item.title}
          </p>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed text-muted-foreground",
              dark && "text-hero-ink/70"
            )}
          >
            <InlineText text={item.text} />
          </p>
        </li>
      ))}
    </ol>
  );
}
