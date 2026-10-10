"use client";

import Link from "next/link";

import { DEFAULT_ERROR_MESSAGE, ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary: any uncaught render/data error lands here instead of
 * Next's bare default page. `reset()` re-renders the failed segment.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center" role="alert">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{DEFAULT_ERROR_MESSAGE}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" render={<Link href={ROUTES.home} />}>
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}
