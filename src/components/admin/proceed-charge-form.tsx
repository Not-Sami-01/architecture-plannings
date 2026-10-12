"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, useWatch } from "react-hook-form";

import {
  ORDER_STATUSES,
  PAYMENT_TYPES,
  type OrderStatus,
  type PaymentType,
} from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { useAdminCreatePayment } from "@/hooks/payments/use-admin-create-payment";
import { ApiClientError } from "@/lib/api-client/api";
import {
  createPaymentFormSchema,
  type CreatePaymentFormValues,
} from "@/lib/validators/payments";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProceedChargeFormProps = {
  orderId: string;
  /** The order's package list price — the prefill for a custom amount. */
  packagePrice: number;
  /** Order currency snapshot (plan 3). */
  currency: string;
  status: OrderStatus;
  onDone?: () => void;
};

/** Sensible charge type from where the order sits in the flow. */
function defaultChargeType(status: OrderStatus): PaymentType {
  if (status === ORDER_STATUSES.AWAITING_ADVANCE) return PAYMENT_TYPES.ADVANCE;
  if (status === ORDER_STATUSES.AWAITING_FINAL_PAYMENT) return PAYMENT_TYPES.FINAL;
  return PAYMENT_TYPES.EXTRA_REVISION;
}

/** Charge-user step of the Proceed dialog (plan 2 P4/P5). */
export function ProceedChargeForm({
  orderId,
  packagePrice,
  currency,
  status,
  onDone,
}: ProceedChargeFormProps) {
  const create = useAdminCreatePayment(orderId);

  const form = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentFormSchema),
    defaultValues: {
      // Autocomplete with the pricing plan; the admin can override freely.
      amount: packagePrice,
      type: defaultChargeType(status),
      note: "",
    },
  });
  // Compiler memoizes form.formState reads; useFormState subscribes (facebook/react#29144).
  const { errors } = useFormState({ control: form.control });
  const amount = useWatch({ control: form.control, name: "amount" });
  const type = useWatch({ control: form.control, name: "type" });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.actions.create({
        amount: values.amount,
        type: values.type,
        note: values.note?.trim() || undefined,
      });
      onDone?.();
    } catch (error) {
      // Toasts live in the hook; map field-level API errors onto the form.
      if (error instanceof ApiClientError && Array.isArray(error.details)) {
        for (const issue of error.details as Array<{ path: (string | number)[]; message: string }>) {
          const field = issue.path.join(".");
          if (field in form.getValues()) {
            form.setError(field as keyof CreatePaymentFormValues, { message: issue.message });
          }
        }
      }
    }
  });

  const preset = amount !== packagePrice;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.amount ? true : undefined}>
            <FieldLabel htmlFor="charge-amount">Amount ({currency})</FieldLabel>
            <Input
              id="charge-amount"
              type="number"
              min={1}
              step={1}
              {...form.register("amount", { valueAsNumber: true })}
            />
            <FieldError>{errors.amount?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.type ? true : undefined}>
            <FieldLabel htmlFor="charge-type">Charge type</FieldLabel>
            <Select
              value={type}
              onValueChange={(value) => form.setValue("type", value as PaymentType, {
                shouldValidate: true,
              })}
            >
              <SelectTrigger id="charge-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PAYMENT_TYPES).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === PAYMENT_TYPES.ADVANCE
                      ? "Advance payment"
                      : option === PAYMENT_TYPES.FINAL
                        ? "Final payment"
                        : "Extra revision charge"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.type?.message}</FieldError>
          </Field>
        </div>

        {preset ? (
          <button
            type="button"
            className="w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => form.setValue("amount", packagePrice, { shouldValidate: true })}
          >
            Reset to list price ({formatMoney(packagePrice, currency)})
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Autocompleted from the package list price — edit it freely for this order.
          </p>
        )}

        <Field data-invalid={errors.note ? true : undefined}>
          <FieldLabel htmlFor="charge-note">Note to the client (optional)</FieldLabel>
          <Textarea
            id="charge-note"
            rows={2}
            placeholder="Pay at any HBL branch before Friday."
            {...form.register("note")}
          />
          <FieldError>{errors.note?.message}</FieldError>
        </Field>

        <Button type="submit" disabled={create.loadings.creating} className="w-full sm:w-auto">
          {create.loadings.creating ? "Sending…" : "Send charge"}
        </Button>
      </FieldGroup>
    </form>
  );
}
