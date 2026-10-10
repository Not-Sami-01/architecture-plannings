import Link from "next/link";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page may have moved, or the link is wrong. Try one of these instead:
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button render={<Link href={ROUTES.home} />}>Back to home</Button>
          <Button variant="outline" render={<Link href={ROUTES.services} />}>
            View services
          </Button>
        </div>
      </div>
    </main>
  );
}
