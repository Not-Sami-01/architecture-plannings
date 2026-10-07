"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/auth/use-login";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

type LoginFormProps = {
  /** Validated by the page; must be an internal path. */
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const { actions, loadings } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await actions.login(values);
      // Session cookies are set by the full-page navigation.
      router.push(next ?? ROUTES.dashboard);
      router.refresh();
    } catch {
      // Errors are toasted by the hook.
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
      <FieldGroup>
        <Field data-invalid={form.formState.errors.email ? true : undefined}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>

        <Field data-invalid={form.formState.errors.password ? true : undefined}>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>

        <Button type="submit" disabled={loadings.loggingIn} className="w-full">
          {loadings.loggingIn ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
