import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { ROUTES } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PackageCardPackage = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  revisionLimit: number;
  deliverables: string[];
};

type PackageCardProps = {
  package: PackageCardPackage;
};

export function PackageCard({ package: pkg }: PackageCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-3xl font-semibold tracking-tight">{formatMoney(pkg.price)}</p>
        <ul className="flex flex-col gap-2 text-sm">
          {pkg.deliverables.map((deliverable) => (
            <li key={deliverable} className="flex items-center gap-2">
              <CheckIcon className="size-4 text-primary" aria-hidden />
              {deliverable}
            </li>
          ))}
        </ul>
        <Badge variant="secondary" className="w-fit">
          {pkg.revisionLimit} free revisions
        </Badge>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          render={<Link href={`${ROUTES.newOrder}?package=${pkg.slug}`} />}
        >
          Choose {pkg.name}
        </Button>
      </CardFooter>
    </Card>
  );
}
