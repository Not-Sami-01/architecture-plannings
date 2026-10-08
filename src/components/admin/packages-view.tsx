"use client";

import { useState } from "react";
import { PackageIcon, PencilIcon, PlusIcon } from "lucide-react";

import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { useAdminPackages, type AdminPackage } from "@/hooks/packages/use-admin-packages";

import { PackageFormDialog } from "@/components/admin/package-form-dialog";

export function PackagesView() {
  const { data, loadings, query } = useAdminPackages();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPackage | null>(null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (pkg: AdminPackage) => {
    setEditing(pkg);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New package
        </Button>
      </div>

      {loadings.loading ? (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Revisions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : query.isError ? (
        <EmptyState
          icon={PackageIcon}
          title="Couldn't load packages"
          description="Refresh the page to try again."
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="No packages yet"
          description="Create your first package to show pricing on the site."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Revisions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <span className="block font-medium">{pkg.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {pkg.slug} · {pkg.deliverables.length} deliverables
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatMoney(pkg.price)}</TableCell>
                  <TableCell>{pkg.revisionLimit}</TableCell>
                  <TableCell>
                    <Badge variant={pkg.active ? "default" : "secondary"}>
                      {pkg.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(pkg)}
                      aria-label={`Edit ${pkg.name}`}
                    >
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PackageFormDialog open={open} onOpenChange={setOpen} pkg={editing} />
    </div>
  );
}
