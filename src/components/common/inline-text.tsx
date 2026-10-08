import Link from "next/link";

import { parseInline } from "@/lib/content/inline-links";

type InlineTextProps = {
  text: string;
  className?: string;
};

/** Renders copy from content modules, resolving `[label](/route)` and `**bold**`. */
export function InlineText({ text, className }: InlineTextProps) {
  const tokens = parseInline(text);

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        if (token.type === "strong") {
          return (
            <strong key={index} className="font-medium text-foreground">
              {token.text}
            </strong>
          );
        }
        if (token.type === "link") {
          return (
            <Link
              key={index}
              href={token.href}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {token.text}
            </Link>
          );
        }
        return <span key={index}>{token.text}</span>;
      })}
    </span>
  );
}
