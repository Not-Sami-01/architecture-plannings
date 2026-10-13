import Link from "next/link";
import Image from "next/image";
import { CheckIcon } from "lucide-react";

import { APP, PLACEHOLDER_IMAGE, ROUTES } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type PackageCardPackage = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  revisionLimit: number;
  deliverables: string[];
  /** Storage key of the cropped card image (null → placeholder). */
  imageKey?: string | null;
};

type PackageCardProps = {
  package: PackageCardPackage;
  /** Live site currency (plan 3); server parents read getSiteSettings(). */
  currency?: string;
  /** Highlighted card (ring + primary CTA), used on the home page. */
  featured?: boolean;
  /** Badge label shown above the title on a featured card. */
  featuredLabel?: string;
};

export function PackageCard({
  package: pkg,
  currency = APP.currency,
  featured,
  featuredLabel,
}: PackageCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border bg-card",
        featured && "border-primary ring-1 ring-primary/40"
      )}
    >
      <Image
        src={pkg.imageKey ? `/api/packages/${pkg.id}/image` : PLACEHOLDER_IMAGE}
        alt=""
        width={400}
        height={300}
        className="aspect-[4/3] w-full border-b object-cover"
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          {featured && featuredLabel ? (
            <Badge variant="secondary" className="mb-2 w-fit uppercase tracking-widest">
              {featuredLabel}
            </Badge>
          ) : null}
          <h3 className="font-display font-medium text-2xl leading-snug tracking-tight">{pkg.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
        </div>
        <p className="text-2xl font-semibold tracking-tight">{formatMoney(pkg.price, currency)}</p>
        <ul className="flex flex-col gap-2 text-sm">
          {pkg.deliverables.map((deliverable) => (
            <li key={deliverable} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{deliverable}</span>
            </li>
          ))}
        </ul>
        <Badge variant="secondary" className="mt-auto w-fit">
          {pkg.revisionLimit} free revisions
        </Badge>
        <Button
          className="w-full"
          render={<Link href={`${ROUTES.newOrder}?package=${pkg.slug}`} />}
        >
          Choose {pkg.name}
        </Button>
      </div>
    </article>
  );
}
