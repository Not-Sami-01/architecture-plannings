import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type SignInSearchParams = { next?: string };

function safeNextPath(next: string | undefined): string | undefined {
  if (!next?.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SignInSearchParams>;
}) {
  const { next } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <SignIn fallbackRedirectUrl={safeNextPath(next) ?? ROUTES.dashboard} />
    </div>
  );
}
