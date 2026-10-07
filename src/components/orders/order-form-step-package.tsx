"use client";


import { CheckIcon } from "lucide-react";

import { formatMoney } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderFormInstance } from "@/components/orders/order-form";
import type { PackageSummary } from "@/hooks/packages/use-packages";

type OrderFormStepPackageProps = {
  form: OrderFormInstance;
  packages: PackageSummary[];
  loading: boolean;
};

export function OrderFormStepPackage({ form, packages, loading }: OrderFormStepPackageProps) {
  const setValue = form.setValue;
  const selected = form.watch("packageId");

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        No packages are active right now. Please check back soon.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {packages.map((pkg) => {
        const isSelected = selected === pkg.id;
        return (
          <Card
            key={pkg.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => setValue("packageId", pkg.id, { shouldValidate: true })}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setValue("packageId", pkg.id, { shouldValidate: true });
              }
            }}
            className={
              "cursor-pointer transition-colors hover:border-primary" +
              (isSelected ? " border-primary ring-2 ring-primary/30" : "")
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pkg.name}
                {isSelected ? <CheckIcon className="size-5 text-primary" aria-hidden /> : null}
              </CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatMoney(pkg.price)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pkg.revisionLimit} free revisions
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
