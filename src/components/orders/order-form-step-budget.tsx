"use client";

import type * as React from "react";

import { STYLES } from "@/config/constants";
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
import { Textarea } from "@/components/ui/textarea";
import type { OrderFormInstance, OrderFormValues } from "@/components/orders/order-form";

type OrderFormStepBudgetProps = {
  form: OrderFormInstance;
};

export function OrderFormStepBudget({ form }: OrderFormStepBudgetProps) {
  const register = form.register;
  const errors = form.formState.errors;
  const watch = form.watch;
  const setValue = form.setValue;

  return (
    <FieldGroup className="gap-6">
      <Field data-invalid={errors.style ? true : undefined}>
        <FieldLabel>Architectural style</FieldLabel>
        <Select
          value={watch("style")}
          onValueChange={(
            value,
          ) => setValue("style", value as OrderFormValues["style"], { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a style" />
          </SelectTrigger>
          <SelectContent>
            {STYLES.map((style) => (
              <SelectItem key={style} value={style}>
                {style.charAt(0) + style.slice(1).toLowerCase().replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{errors.style?.message}</FieldError>
      </Field>

      <Field data-invalid={errors.budget ? true : undefined}>
        <FieldLabel htmlFor="budget">Construction budget (optional)</FieldLabel>
        <Input id="budget" type="number" min={0} {...register("budget", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} />
        <FieldError>{errors.budget?.message}</FieldError>
      </Field>

      <Field data-invalid={errors.notes ? true : undefined}>
        <FieldLabel htmlFor="notes">Anything else we should know?</FieldLabel>
        <Textarea id="notes" rows={4} {...register("notes")} />
        <FieldError>{errors.notes?.message}</FieldError>
      </Field>
    </FieldGroup>
  );
}
