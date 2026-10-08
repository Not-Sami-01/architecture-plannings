import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/constants";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginSearchParams = { next?: string };

function safeNextPath(next: string | undefined): string | undefined {
  if (!next?.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const { next } = await searchParams;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Track your orders and downloads.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm next={safeNextPath(next)} />
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link href={ROUTES.register} className="font-medium underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
