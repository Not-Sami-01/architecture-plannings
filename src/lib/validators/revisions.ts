import { z } from "zod";

import { REVISIONS } from "@/config/constants";

/** POST /api/orders/:id/revisions — client requests a revision (plan 3 P4). */
export const revisionRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Describe what should change.")
    .max(REVISIONS.maxLength, `Keep the request under ${REVISIONS.maxLength} characters.`),
  fileIds: z
    .array(z.string().min(1))
    .max(REVISIONS.maxRefFiles, `Attach at most ${REVISIONS.maxRefFiles} reference images.`)
    .optional(),
});

export type RevisionRequestInput = z.infer<typeof revisionRequestSchema>;

/** PATCH /api/admin/revisions/:id — admin accepts a revision request. */
export const acceptRevisionSchema = z.object({
  action: z.literal("accept"),
});

export type AcceptRevisionInput = z.infer<typeof acceptRevisionSchema>;
