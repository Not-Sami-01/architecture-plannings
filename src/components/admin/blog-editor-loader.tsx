"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/** TipTap is client-only (plan 6) — no SSR, no hydration mismatch. */
const BlogEditor = dynamic(
  () => import("./blog-editor").then((mod) => mod.BlogEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[46svh] w-full rounded-md" />,
  }
);

export { BlogEditor };
