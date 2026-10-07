import Link from "next/link";

import { APP, ROUTES } from "@/config/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <Link href={ROUTES.home} className="text-xl font-semibold tracking-tight">
        {APP.name}
      </Link>
      {children}
    </main>
  );
}
