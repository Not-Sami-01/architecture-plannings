"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { PortfolioForm } from "@/components/admin/portfolio-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPortfolioProject } from "@/hooks/admin/use-admin-portfolio-project";

export function PortfolioEditView() {
  const params = useParams<{ id: string }>();
  const { data, loadings } = useAdminPortfolioProject(params.id);

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[46svh] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Project not found.{" "}
        <Link href="/admin/portfolio" className="text-primary underline underline-offset-4">
          Back to portfolio
        </Link>
      </p>
    );
  }

  return <PortfolioForm project={data} />;
}
