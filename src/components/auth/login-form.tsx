"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useFormState } from "react-hook-form";

import { ROLES, ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLogin } from "@/hooks/auth/use-login";
import { useSession } from "@/hooks/auth/use-session";
import { GoogleButton } from "@/components/auth/google-button";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

type LoginFormProps = {
  /** Validated by the page; must be an internal path. */
  next?: string;
  /** True when GOOGLE_CLIENT_ID/SECRET are configured (server-computed). */
  googleEnabled?: boolean;
};

export function LoginForm({ next, googleEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const { actions, loadings } = useLogin();
  const session = useSession();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  // `form.formState.errors` reads are memoized on `form` by React Compiler and
  // would never update (facebook/react#29144); useFormState subscribes via state.
  const { errors } = useFormState({ control: form.control });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await actions.login(values);
      // The cookie is set by the time signIn resolves; refetch to learn the
      // role, then land admins in the admin panel and clients on the dashboard.
      const refreshed = await session.query.refetch();
      const role = refreshed.data?.role;
      router.push(
        next ?? (role === ROLES.ADMIN ? ROUTES.admin.orders : ROUTES.dashboard),
      );
      router.refresh();
    } catch {
      // Errors are toasted by the hook.
    }
  });

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
        <FieldGroup>
          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...form.register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.password ? true : undefined}>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Button type="submit" disabled={loadings.loggingIn} className="w-full">
            {loadings.loggingIn ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      {googleEnabled ? (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Separator />
          {/* Role is unknown pre-auth; admins land on the dashboard and can
              open the admin panel from its nav link. */}
          <GoogleButton callbackUrl={next ?? ROUTES.dashboard} />
        </div>
      ) : null}
    </>
  );
}
