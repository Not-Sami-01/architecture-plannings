import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy>
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
