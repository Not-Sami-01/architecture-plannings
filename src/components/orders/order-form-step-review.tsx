"use client";



import { useWatch } from "react-hook-form";

import { formatBytes, formatMoney } from "@/lib/format";
import type { StagedFile } from "@/lib/staged-files";
import type { OrderFormInstance } from "@/components/orders/order-form";
import type { PackageSummary } from "@/hooks/packages/use-packages";
import { Separator } from "@/components/ui/separator";

type OrderFormStepReviewProps = {
  form: OrderFormInstance;
  packages: PackageSummary[];
  files: StagedFile[];
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function OrderFormStepReview({ form, packages, files }: OrderFormStepReviewProps) {
  // `form.watch()` would be memoized on `form` by React Compiler (facebook/react#29144).
  const values = useWatch({ control: form.control });

  const pkg = packages.find((candidate) => candidate.id === values.packageId);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl border p-5">
        <p className="font-medium">Package</p>
        <Row label="Package" value={pkg ? `${pkg.name} — ${formatMoney(pkg.price)}` : "Not selected"} />
        <Row label="Included revisions" value={pkg ? pkg.revisionLimit : "—"} />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-5">
        <p className="font-medium">Plot</p>
        <Row
          label="Size"
          value={`${values.plot?.width ?? "—"} × ${values.plot?.length ?? "—"} ${values.plot?.unit ?? ""}`}
        />
        <Row label="Facing" value={values.plot?.facing ?? "—"} />
        <Row label="Road sides" value={(values.plot?.roadSides ?? []).join(", ") || "—"} />
        <Row label="City" value={values.plot?.city || "—"} />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-5">
        <p className="font-medium">Requirements</p>
        <Row label="Floors" value={values.requirements?.floors ?? "—"} />
        <Row label="Bedrooms" value={values.requirements?.bedrooms ?? "—"} />
        <Row label="Bathrooms" value={values.requirements?.bathrooms ?? "—"} />
        <Row label="Kitchen" value={values.requirements?.kitchenType ?? "—"} />
        <Row label="Garage / Lounge" value={`${values.requirements?.garage ? "Yes" : "No"} / ${values.requirements?.lounge ? "Yes" : "No"}`} />
        {values.requirements?.extras ? <Row label="Extras" value={values.requirements.extras} /> : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-5">
        <p className="font-medium">Style &amp; notes</p>
        <Row label="Style" value={values.style} />
        {values.budget ? <Row label="Budget" value={formatMoney(Number(values.budget))} /> : null}
        {values.notes ? <Row label="Notes" value={values.notes} /> : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-5">
        <p className="font-medium">
          Reference files
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {files.length === 0
              ? "none attached"
              : `${files.length} file${files.length === 1 ? "" : "s"} — uploaded when you submit`}
          </span>
        </p>
        {files.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {files.map((file) => (
              <li
                key={file.key}
                className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
              >
                <span className="min-w-0 truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="shrink-0 text-xs">{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Optional — add them from the Files step if the designer should see them.
          </p>
        )}
      </section>

      <Separator />
    </div>
  );
}
