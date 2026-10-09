import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="w-full max-w-sm">
      <SignUp fallbackRedirectUrl={ROUTES.dashboard} />
    </div>
  );
}
