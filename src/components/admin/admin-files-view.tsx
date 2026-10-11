"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { API_ROUTES, FILE_KINDS, ROUTES } from "@/config/constants";
import type { FileKind } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import { useAdminFiles, type AdminFileRow } from "@/hooks/admin/use-admin-files";
import { useUpdateAdminFile } from "@/hooks/admin/use-update-admin-file";
import { useDeleteAdminFile } from "@/hooks/admin/use-delete-admin-file";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;
const KIND_VALUES = Object.values(FILE_KINDS) as FileKind[];

export function AdminFilesView() {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data: files, loadings, query } = useAdminFiles({
    q: search || undefined,
    kind: kindFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const updateFile = useUpdateAdminFile();
  const deleteFile = useDeleteAdminFile();

  const [editing, setEditing] = useState<AdminFileRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editKind, setEditKind] = useState<FileKind>(FILE_KINDS.CLIENT);
  const [deleting, setDeleting] = useState<AdminFileRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const openEdit = (file: AdminFileRow) => {
    setEditing(file);
    setEditName(file.filename);
    setEditKind(file.kind as FileKind);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateFile.actions.update({
        id: editing.id,
        filename: editName.trim() || undefined,
        kind: editKind,
      });
      setEditing(null);
    } catch {
      // Toast shown by the hook.
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteFile.actions.remove({ id: deleting.id });
      setDeleting(null);
      setDeleteConfirmText("");
    } catch {
      // Toast shown by the hook.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Files" description="Every file ever uploaded, across all orders." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <SearchIcon
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search filename or order number…"
            className="pl-9"
            aria-label="Search files"
          />
        </div>
        <Select
          value={kindFilter}
          onValueChange={(value) => {
            setKindFilter(value === "ALL" || value === null ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48" aria-label="Filter by kind">
            <SelectValue placeholder="All kinds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All kinds</SelectItem>
            {KIND_VALUES.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {kind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadings.loading ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          title="Files couldn't load"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : files.length === 0 ? (
        <EmptyState title="No files found" description="Nothing matches the current filters." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="max-w-56">
                    <p className="truncate font-medium">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{file.mime}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.kind}</Badge>
                  </TableCell>
                  <TableCell>
                    {file.order ? (
                      <Link
                        href={ROUTES.admin.order(file.order.id)}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        {file.order.number}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatBytes(file.size)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <a
                        href={API_ROUTES.fileDownload(file.id)}
                        className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Download
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${file.filename}`}
                        onClick={() => openEdit(file)}
                      >
                        <PencilIcon className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${file.filename}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleting(file);
                          setDeleteConfirmText("");
                        }}
                      >
                        <Trash2Icon className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit file</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="file-name">Filename</Label>
              <Input
                id="file-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={255}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="file-kind">Kind</Label>
              <Select value={editKind} onValueChange={(value) => setEditKind(value as FileKind)}>
                <SelectTrigger id="file-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_VALUES.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={updateFile.loadings.updating} onClick={() => void saveEdit()}>
              {updateFile.loadings.updating ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file permanently?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleting?.filename} will be removed from storage and the database. This cannot be
            undone. Type the filename to confirm.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder={deleting?.filename}
            aria-label="Type the filename to confirm deletion"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== deleting?.filename || deleteFile.loadings.deleting}
              onClick={() => void confirmDelete()}
            >
              {deleteFile.loadings.deleting ? "Deleting…" : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={files.length < PAGE_SIZE}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
