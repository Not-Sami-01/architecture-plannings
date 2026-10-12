"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";

import { FILE_KINDS, ORDER_STATUSES } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import { useAdminRegisterDraft } from "@/hooks/orders/use-admin-register-draft";
import { useAdminRegisterFinals } from "@/hooks/orders/use-admin-register-finals";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type DeliverDraftDialogProps = {
  order: AdminOrderDetail;
};

/**
 * Deliver-draft dialog (plan 3 P6): pick already-uploaded DRAFT_* files
 * (upload new ones first via Proceed → Drop files), optional note, and the
 * status machine moves IN_DESIGN → DRAFT_DELIVERED server-side.
 */
export function DeliverDraftDialog({ order }: DeliverDraftDialogProps) {
  const register = useAdminRegisterDraft(order.id);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const candidates = order.files.filter(
    (file) => file.kind === FILE_KINDS.DRAFT_PREVIEW || file.kind === FILE_KINDS.DRAFT_ORIGINAL,
  );

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const submit = async () => {
    try {
      await register.actions.save({
        fileIds: selected,
        note: note.trim() || undefined,
      });
      setOpen(false);
      setSelected([]);
      setNote("");
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(order.id) });
    } catch {
      // Toast already shown by the hook.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Deliver draft</Button>} />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deliver the draft</DialogTitle>
          <DialogDescription>
            Moves {order.number} to “Draft delivered” and closes open revision requests.
            Upload missing files first via Proceed → Drop files.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No draft files uploaded yet. Use Proceed → Drop files with the “Draft preview” or
            “Draft original” kind first.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {candidates.map((file) => (
              <li key={file.id}>
                <label className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
                  <Checkbox
                    checked={selected.includes(file.id)}
                    onCheckedChange={(checked) => toggle(file.id, checked === true)}
                    aria-label={`Include ${file.filename}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  <span className="text-xs text-muted-foreground">
                    {file.kind === FILE_KINDS.DRAFT_PREVIEW ? "preview" : "original"}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <Field>
          <FieldLabel htmlFor="draft-note">Note to the client (optional)</FieldLabel>
          <Textarea
            id="draft-note"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="First draft of the ground floor plan attached."
          />
        </Field>

        <DialogFooter>
          <Button
            disabled={selected.length === 0 || register.loadings.saving}
            onClick={() => void submit()}
          >
            {register.loadings.saving ? "Delivering…" : "Deliver draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RegisterFinalsDialogProps = {
  order: AdminOrderDetail;
};

/**
 * Register-final-files dialog (plan 3 P6): no status change — clients unlock
 * finals only after the final payment is verified (server-enforced).
 */
export function RegisterFinalsDialog({ order }: RegisterFinalsDialogProps) {
  const register = useAdminRegisterFinals(order.id);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const candidates = order.files.filter((file) => file.kind === FILE_KINDS.FINAL);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const submit = async () => {
    try {
      await register.actions.save({ fileIds: selected });
      setOpen(false);
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(order.id) });
    } catch {
      // Toast already shown by the hook.
    }
  };

  const fromStatus = order.status;
  const allowed =
    fromStatus !== ORDER_STATUSES.COMPLETED && fromStatus !== ORDER_STATUSES.CANCELLED;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" disabled={!allowed}>
            Register finals
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register final files</DialogTitle>
          <DialogDescription>
            Files of the “Final drawings” kind on this order. The client unlocks downloads once
            the final payment is verified — this step sets nothing else.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No final files uploaded yet. Use Proceed → Drop files with the “Final drawings” kind
            first.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {candidates.map((file) => (
              <li key={file.id}>
                <label className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
                  <Checkbox
                    checked={selected.includes(file.id)}
                    onCheckedChange={(checked) => toggle(file.id, checked === true)}
                    aria-label={`Include ${file.filename}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button
            disabled={selected.length === 0 || register.loadings.saving}
            onClick={() => void submit()}
          >
            <CheckIcon className="size-4" aria-hidden />
            {register.loadings.saving ? "Registering…" : "Register finals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
