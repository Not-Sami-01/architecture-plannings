"use client";

import { CheckIcon, LayersIcon } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { OrderFormInstance } from "@/components/orders/order-form";
import type { PackageSummary } from "@/hooks/packages/use-packages";

type OrderFormSelectedPackageProps = {
  form: OrderFormInstance;
  packages: PackageSummary[];
  onChange?: () => void;
};

/**
 * Compact summary of the chosen package, rendered on every step so the
 * selection is always visible (user-reported gap: selection disappeared
 * after step 1).
 */
export function OrderFormSelectedPackage({ form, packages, onChange }: OrderFormSelectedPackageProps) {
  const packageId = form.watch("packageId");
  const pkg = packages.find((candidate) => candidate.id === packageId);

  if (!pkg) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <LayersIcon className="size-5 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          {pkg.name}
          <CheckIcon className="size-4 text-primary" aria-hidden />
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(pkg.price)} · {pkg.revisionLimit} free revisions
        </p>
      </div>
      {onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Change
        </button>
      ) : null}
    </div>
  );
}
