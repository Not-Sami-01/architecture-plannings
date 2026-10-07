"use client";



import { KITCHEN_TYPES } from "@/config/constants";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { OrderFormInstance } from "@/components/orders/order-form";

type OrderFormStepRequirementsProps = {
  form: OrderFormInstance;
};

const KITCHEN_LABELS: Record<(typeof KITCHEN_TYPES)[number], string> = {
  OPEN: "Open kitchen",
  CLOSED: "Closed kitchen",
};

export function OrderFormStepRequirements({ form }: OrderFormStepRequirementsProps) {
  const register = form.register;
  const errors = form.formState.errors;
  const watch = form.watch;
  const setValue = form.setValue;
  const reqErrors = errors.requirements ?? {};

  return (
    <FieldGroup className="gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={reqErrors.floors ? true : undefined}>
          <FieldLabel htmlFor="floors">Floors</FieldLabel>
          <Input id="floors" type="number" min={1} max={4} {...register("requirements.floors")} />
          <FieldError>{reqErrors.floors?.message}</FieldError>
        </Field>
        <Field data-invalid={reqErrors.bedrooms ? true : undefined}>
          <FieldLabel htmlFor="bedrooms">Bedrooms</FieldLabel>
          <Input id="bedrooms" type="number" min={0} max={20} {...register("requirements.bedrooms")} />
          <FieldError>{reqErrors.bedrooms?.message}</FieldError>
        </Field>
        <Field data-invalid={reqErrors.bathrooms ? true : undefined}>
          <FieldLabel htmlFor="bathrooms">Bathrooms</FieldLabel>
          <Input id="bathrooms" type="number" min={0} max={20} {...register("requirements.bathrooms")} />
          <FieldError>{reqErrors.bathrooms?.message}</FieldError>
        </Field>
      </div>

      <Field>
        <FieldLabel>Kitchen type</FieldLabel>
        <Select
          value={watch("requirements.kitchenType")}
          onValueChange={(value) =>
            setValue(
              "requirements.kitchenType",
              value as (typeof KITCHEN_TYPES)[number],
              { shouldValidate: true }
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KITCHEN_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {KITCHEN_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={watch("requirements.garage")}
            onCheckedChange={(checked) =>
              setValue("requirements.garage", checked === true, { shouldValidate: true })
            }
          />
          Garage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={watch("requirements.lounge")}
            onCheckedChange={(checked) =>
              setValue("requirements.lounge", checked === true, { shouldValidate: true })
            }
          />
          Lounge
        </label>
      </div>

      <Field data-invalid={reqErrors.extras ? true : undefined}>
        <FieldLabel htmlFor="extras">Extra requirements (optional)</FieldLabel>
        <Textarea id="extras" rows={3} placeholder="Prayer room, small lawn, rooftop access…" {...register("requirements.extras")} />
        <FieldError>{reqErrors.extras?.message}</FieldError>
      </Field>
    </FieldGroup>
  );
}
