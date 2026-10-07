"use client";



import { formatMoney } from "@/lib/format";
import type { OrderFormInstance } from "@/components/orders/order-form";
import type { PackageSummary } from "@/hooks/packages/use-packages";
import { Separator } from "@/components/ui/separator";

type OrderFormStepReviewProps = {
  form: OrderFormInstance;
  packages: PackageSummary[];
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function OrderFormStepReview({ form, packages }: OrderFormStepReviewProps) {
  const values = form.watch();

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
        <Row label="Files attached" value={values.fileIds?.length ?? 0} />
      </section>

      <Separator />
    </div>
  );
}
