"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";

import { ORDER_DEFAULTS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSendQuote } from "@/hooks/orders/use-send-quote";
import { ApiClientError } from "@/lib/api-client/api";
import { quoteFormSchema, type QuoteFormValues } from "@/lib/validators/admin-orders";

type QuoteFormProps = {
  orderId: string;
};

/** Send-quote panel shown while the order is SUBMITTED (API.md §8). */
export function QuoteForm({ orderId }: QuoteFormProps) {
  const { actions, loadings } = useSendQuote();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      totalPrice: 0,
      advancePercent: ORDER_DEFAULTS.advancePercent,
      message: "",
    },
  });
  // Compiler memoizes form.formState reads; useFormState subscribes (facebook/react#29144).
  const { errors } = useFormState({ control: form.control });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await actions.send({
        id: orderId,
        input: {
          totalPrice: values.totalPrice,
          advancePercent: values.advancePercent,
          message: values.message?.trim() || undefined,
        },
      });
      form.reset({
        totalPrice: 0,
        advancePercent: ORDER_DEFAULTS.advancePercent,
        message: "",
      });
    } catch (error) {
      // Toasts live in the hook; map field-level API errors onto the form.
      if (error instanceof ApiClientError && Array.isArray(error.details)) {
        for (const issue of error.details as Array<{ path: (string | number)[]; message: string }>) {
          const field = issue.path.join(".");
          if (field in form.getValues()) {
            form.setError(field as keyof QuoteFormValues, { message: issue.message });
          }
        }
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.totalPrice ? true : undefined}>
            <FieldLabel htmlFor="quote-price">Total price (PKR)</FieldLabel>
            <Input
              id="quote-price"
              type="number"
              min={1}
              step={1}
              placeholder="25000"
              {...form.register("totalPrice", { valueAsNumber: true })}
            />
            <FieldError>{errors.totalPrice?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.advancePercent ? true : undefined}>
            <FieldLabel htmlFor="quote-advance">Advance %</FieldLabel>
            <Input
              id="quote-advance"
              type="number"
              min={1}
              max={100}
              step={1}
              {...form.register("advancePercent", { valueAsNumber: true })}
            />
            <FieldError>{errors.advancePercent?.message}</FieldError>
          </Field>
        </div>

        <Field data-invalid={errors.message ? true : undefined}>
          <FieldLabel htmlFor="quote-message">Note to the client</FieldLabel>
          <Textarea
            id="quote-message"
            rows={3}
            placeholder="Delivery in 7 days after advance."
            {...form.register("message")}
          />
          <FieldError>{errors.message?.message}</FieldError>
        </Field>

        <Button type="submit" disabled={loadings.sending} className="w-full sm:w-auto">
          {loadings.sending ? "Sending…" : "Send quote"}
        </Button>
      </FieldGroup>
    </form>
  );
}
