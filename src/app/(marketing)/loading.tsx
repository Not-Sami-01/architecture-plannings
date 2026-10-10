import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12" aria-busy>
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="mt-10 h-64 w-full" />
    </main>
  );
}
