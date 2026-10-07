"use client";

import { BadgeCheckIcon, CheckIcon } from "lucide-react";

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
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
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
              "relative cursor-pointer transition-all hover:border-primary hover:shadow-md " +
              (isSelected
                ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/40"
                : "")
            }
          >
            {isSelected ? (
              <BadgeCheckIcon
                className="absolute right-3 top-3 size-5 text-primary"
                aria-label="Selected"
              />
            ) : null}
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-2xl font-semibold tracking-tight">
                {formatMoney(pkg.price)}
              </p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {pkg.deliverables.map((deliverable) => (
                  <li key={deliverable} className="flex items-center gap-2">
                    <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden />
                    {deliverable}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Includes {pkg.revisionLimit} free revisions
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
