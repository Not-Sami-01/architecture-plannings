"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilIcon, SearchIcon } from "lucide-react";

import { APP, ROLES, ROUTES } from "@/config/constants";
import { useAdminUsers, type AdminUserRow } from "@/hooks/admin/use-admin-users";
import { useUpdateAdminUser } from "@/hooks/admin/use-update-admin-user";
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

type RoleSelectValue = (typeof ROLES)[keyof typeof ROLES];

export function AdminUsersView() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: users, loadings, query } = useAdminUsers({
    q: search || undefined,
    role: roleFilter || undefined,
    page,
    pageSize,
  });
  const updateUser = useUpdateAdminUser();

  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<RoleSelectValue>(ROLES.CLIENT);

  const openEdit = (user: AdminUserRow) => {
    setEditing(user);
    setEditName(user.name ?? "");
    setEditRole(user.role);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateUser.actions.update({
        id: editing.id,
        name: editName.trim() || undefined,
        role: editRole,
      });
      setEditing(null);
    } catch {
      // Toast shown by the hook.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Everyone with an account on the platform." />

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
            placeholder="Search name or email…"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value === "ALL" || value === null ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value={ROLES.CLIENT}>Clients</SelectItem>
            <SelectItem value={ROLES.ADMIN}>Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadings.loading ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          title="Users couldn't load"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No accounts match the current filters."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell className="max-w-48 truncate">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === ROLES.ADMIN ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{user.ordersCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${user.name ?? user.email}`}
                      onClick={() => openEdit(user)}
                    >
                      <PencilIcon className="size-4" aria-hidden />
                    </Button>
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
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-role">Role</Label>
              <Select value={editRole} onValueChange={(value) => setEditRole(value as RoleSelectValue)}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.CLIENT}>Client</SelectItem>
                  <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing role updates Clerk metadata and the database together; it applies on the
                user&apos;s next request.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={updateUser.loadings.updating} onClick={() => void saveEdit()}>
              {updateUser.loadings.updating ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page}
          {query.dataUpdatedAt ? "" : ""}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={users.length < pageSize}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <p className="sr-only">{APP.name} user management.</p>
      <Link href={ROUTES.admin.orders} className="sr-only">
        Back
      </Link>
    </div>
  );
}
