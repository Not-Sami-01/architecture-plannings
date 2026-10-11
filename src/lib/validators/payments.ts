import { z } from "zod";

import { PAYMENT_STATUSES, PAYMENT_TYPES } from "@/config/constants";

type PaymentTypeValue = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES];
type PaymentStatusValue = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

const paymentTypeValues = Object.values(PAYMENT_TYPES) as [PaymentTypeValue, ...PaymentTypeValue[]];
const verifiableStatuses = [PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.REJECTED] as [
  PaymentStatusValue,
  ...PaymentStatusValue[],
];

/** POST /api/admin/orders/:id/payments — admin creates a charge (plan 2 P4). */
export const createPaymentSchema = z.object({
  amount: z
    .number({ message: "Enter an amount." })
    .int("Amount must be a whole number.")
    .positive("Amount must be greater than zero.")
    .max(100_000_000, "That amount looks too large — check the digits."),
  type: z.enum(paymentTypeValues),
  note: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/** Client twin for the charge dialog (RHF + zodResolver; no coerce/defaults). */
export const createPaymentFormSchema = z.object({
  amount: z
    .number({ message: "Enter an amount." })
    .int("Amount must be a whole number.")
    .positive("Amount must be greater than zero."),
  type: z.enum(paymentTypeValues),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
});

export type CreatePaymentFormValues = z.infer<typeof createPaymentFormSchema>;

/** PATCH /api/admin/payments/:id — verify or reject a payment. */
export const verifyPaymentSchema = z.object({
  status: z.enum(verifiableStatuses),
  note: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/** POST /api/payments/:id/proof — client attaches their transfer proof. */
export const paymentProofSchema = z.object({
  fileId: z.string().cuid2(),
});

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
