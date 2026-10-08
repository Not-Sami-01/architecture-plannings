"use client";

import { useRef, useState } from "react";

import type { StagedFile } from "@/lib/staged-files";
import type { OrderFormValues } from "@/lib/validators/order";
import { useUploadBatch, UploadBatchError } from "@/hooks/files/use-upload-batch";

import { useCreateOrder, type CreatedOrder } from "./use-create-order";

export type SubmitOrderInput = {
  values: OrderFormValues;
  files: StagedFile[];
};

export type SubmitPhase = "idle" | "uploading" | "submitting" | "failed";

/**
 * The one entry point for the order form's submit button: uploads every
 * staged file first, and **never** calls POST /api/orders unless all of them
 * succeeded (a failed batch rejects with `UploadBatchError`). Per-file
 * progress is exposed through `data.items` for the submit overlay.
 */
export function useSubmitOrder() {
  const batch = useUploadBatch();
  const create = useCreateOrder();
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const lastInput = useRef<SubmitOrderInput | null>(null);

  const run = async (input: SubmitOrderInput): Promise<CreatedOrder> => {
    lastInput.current = input;
    setPhase("uploading");
    try {
      const fileIds = input.files.length > 0 ? await batch.actions.upload(input.files) : [];
      setPhase("submitting");
      const order = await create.actions.create({ ...input.values, fileIds });
      batch.actions.reset();
      setPhase("idle");
      return order;
    } catch (error) {
      if (error instanceof UploadBatchError) {
        // Keep the per-file rows: the overlay offers "Retry" / "Edit files".
        setPhase("failed");
      } else {
        // 401 redirects to login (api util); other API errors are toasted by
        // useCreateOrder — either way the overlay must not stay up.
        setPhase("idle");
      }
      throw error;
    }
  };

  return {
    data: {
      phase,
      items: batch.data.items,
      order: create.data,
    },
    loadings: {
      uploading: phase === "uploading",
      submitting: phase === "submitting",
      creating: create.loadings.creating,
      busy: phase !== "idle",
    },
    actions: {
      submit: run,
      /**
       * Failed batch → back to the files step. Finished rows are kept so the
       * next attempt only uploads what is still missing (the batch itself
       * resets whenever the file set changes).
       */
      dismiss: () => setPhase("idle"),
      retry: () => (lastInput.current ? run(lastInput.current) : Promise.resolve(null)),
    },
    query: create.query,
  };
}
