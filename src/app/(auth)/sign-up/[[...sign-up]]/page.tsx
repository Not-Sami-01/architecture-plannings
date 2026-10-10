import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

type SignUpSearchParams = { next?: string };

function safeNextPath(next: string | undefined): string | undefined {
  if (!next?.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SignUpSearchParams>;
}) {
  const { next } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <SignUp fallbackRedirectUrl={safeNextPath(next) ?? ROUTES.dashboard} />
    </div>
  );
}
