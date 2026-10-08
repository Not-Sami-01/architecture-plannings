"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type GoogleButtonProps = {
  /** Where Auth.js sends the browser after the OAuth round-trip. */
  callbackUrl: string;
};

/** "Continue with Google" — rendered only when the provider is configured. */
export function GoogleButton({ callbackUrl }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        void signIn("google", { callbackUrl });
      }}
    >
      Continue with Google
    </Button>
  );
}
