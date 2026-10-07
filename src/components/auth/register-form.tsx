"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/auth/use-login";
import { useRegister } from "@/hooks/auth/use-register";
import { ApiClientError } from "@/lib/api-client/api";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

export function RegisterForm() {
  const router = useRouter();
  const { actions: registerActions, loadings: registerLoadings } = useRegister();
  const { actions: loginActions, loadings: loginLoadings } = useLogin();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const submitting = registerLoadings.creating || loginLoadings.loggingIn;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerActions.register(values);
      // Sign straight in so the new client lands on the dashboard.
      await loginActions.login({ email: values.email, password: values.password });
      router.push(ROUTES.dashboard);
      router.refresh();
    } catch (error) {
      // Toasts are handled by the hooks; map field-level details onto the form.
      if (error instanceof ApiClientError && Array.isArray(error.details)) {
        for (const issue of error.details as Array<{ path: (string | number)[]; message: string }>) {
          const field = issue.path.join(".");
          if (field in form.getValues()) {
            form.setError(field as keyof RegisterInput, { message: issue.message });
          }
        }
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
      <FieldGroup>
        <Field data-invalid={form.formState.errors.name ? true : undefined}>
          <FieldLabel htmlFor="register-name">Full name</FieldLabel>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder="Ali Khan"
            {...form.register("name")}
          />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>

        <Field data-invalid={form.formState.errors.email ? true : undefined}>
          <FieldLabel htmlFor="register-email">Email</FieldLabel>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>

        <Field data-invalid={form.formState.errors.password ? true : undefined}>
          <FieldLabel htmlFor="register-password">Password</FieldLabel>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>

        <Field data-invalid={form.formState.errors.phone ? true : undefined}>
          <FieldLabel htmlFor="register-phone">Phone (WhatsApp)</FieldLabel>
          <Input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+92 300 1234567"
            {...form.register("phone")}
          />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
