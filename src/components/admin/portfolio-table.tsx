"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { API_ROUTES } from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPortfolioProjects } from "@/hooks/admin/use-admin-portfolio-projects";
import {
  useDeletePortfolioProject,
  useReorderPortfolioProjects,
  useUpdatePortfolioProject,
} from "@/hooks/admin/use-admin-portfolio-mutations";

export function PortfolioTable() {
  const { data, loadings } = useAdminPortfolioProjects();
  const { actions: updateActions } = useUpdatePortfolioProject();
  const { actions: reorderActions, loadings: reorderLoadings } = useReorderPortfolioProjects();
  const { actions: deleteActions, loadings: deleteLoadings } = useDeletePortfolioProject();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= data.length) return;
    const ids = data.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await reorderActions.reorder(ids);
  };

  if (loadings.loading) {
    return (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Plot</TableHead>
              <TableHead>Style</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No projects yet"
        description="Add your first project to fill the /portfolio gallery."
        action={
          <Button render={<Link href="/admin/portfolio/new" />}>New project</Button>
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Plot</TableHead>
              <TableHead>Style</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((project, index) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Move up"
                        disabled={index === 0 || reorderLoadings.reordering}
                        onClick={() => void move(index, -1)}
                      >
                        <ArrowUpIcon aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Move down"
                        disabled={index === data.length - 1 || reorderLoadings.reordering}
                        onClick={() => void move(index, 1)}
                      >
                        <ArrowDownIcon aria-hidden />
                      </Button>
                    </div>
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {project.images[0] ? (
                        <Image
                          src={API_ROUTES.portfolioImage(project.images[0])}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="absolute inset-0 m-auto size-4 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/portfolio/${project.id}`}
                        className="flex items-center gap-1.5 font-medium hover:underline"
                      >
                        {project.featured ? (
                          <StarIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
                        ) : null}
                        <span className="truncate">{project.title}</span>
                      </Link>
                      <p className="text-xs text-muted-foreground">/portfolio/{project.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{project.category}</Badge>
                </TableCell>
                <TableCell className="text-sm">{project.plotSize}</TableCell>
                <TableCell className="text-sm">{project.style}</TableCell>
                <TableCell>
                  <Switch
                    checked={project.featured}
                    aria-label="Featured"
                    onCheckedChange={(checked) =>
                      void updateActions.update({ id: project.id, input: { featured: checked } })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={project.visible}
                      aria-label="Visible"
                      onCheckedChange={(checked) =>
                        void updateActions.update({ id: project.id, input: { visible: checked } })
                      }
                    />
                    {project.visible ? (
                      <EyeIcon className="size-3.5 text-muted-foreground" aria-hidden />
                    ) : (
                      <EyeOffIcon className="size-3.5 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit project"
                      render={<Link href={`/admin/portfolio/${project.id}`} />}
                    >
                      <PencilIcon aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete project"
                      onClick={() => setDeletingId(project.id)}
                    >
                      <Trash2Icon aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>
              The project and its gallery images are removed permanently. Its public URL will 404.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLoadings.deleting}
              onClick={async () => {
                if (!deletingId) return;
                await deleteActions.remove(deletingId);
                setDeletingId(null);
              }}
            >
              {deleteLoadings.deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
