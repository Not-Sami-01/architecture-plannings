type NumberedCard = {
  title: string;
  text: string;
};

type NumberedCardsProps = {
  items: readonly NumberedCard[];
  /** Grid columns on large screens (default 5). */
  columns?: 3 | 5;
  className?: string;
};

/** Numbered card grid — used for the home process section. */
export function NumberedCards({ items, columns = 5, className }: NumberedCardsProps) {
  const columnsClass = columns === 5 ? "lg:grid-cols-5" : "md:grid-cols-3";

  return (
    <ol className={`grid gap-4 sm:grid-cols-2 ${columnsClass} ${className ?? ""}`}>
      {items.map((item, index) => (
        <li key={item.title} className="rounded-xl border bg-card p-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">
            {index + 1}
          </span>
          <p className="mt-3 font-medium">{item.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
