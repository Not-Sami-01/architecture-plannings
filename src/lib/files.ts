import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { buildStorageKey, deleteObject, getObject, presignUpload } from "@/lib/storage";
import {
  ADMIN_EXTRA_MIME_TYPES,
  CLIENT_MIME_TYPES,
  FILE_KINDS,
  FILE_LIMITS,
  ROLES,
  type FileKind,
} from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";

/** File service (FR-15–FR-18). Size and mime are always re-checked here. */

type PresignInput = {
  filename: string;
  mime: string;
  size: number;
  kind: FileKind;
};

function assertCanUpload(user: ApiUser, input: PresignInput) {
  const isAdmin = user.role === ROLES.ADMIN;
  const allowed = isAdmin
    ? [...CLIENT_MIME_TYPES, ...ADMIN_EXTRA_MIME_TYPES]
    : (CLIENT_MIME_TYPES as readonly string[]);
  const maxSize = isAdmin ? FILE_LIMITS.adminMaxSizeBytes : FILE_LIMITS.clientMaxSizeBytes;

  if (!allowed.includes(input.mime)) {
    throw ApiError.unsupportedFileType();
  }
  if (input.size <= 0 || input.size > maxSize) {
    throw ApiError.fileTooLarge();
  }

  const allowedKinds: FileKind[] = isAdmin
    ? Object.values(FILE_KINDS)
    : [FILE_KINDS.CLIENT, FILE_KINDS.REVISION_REF];

  if (!allowedKinds.includes(input.kind)) {
    throw ApiError.forbidden("You cannot upload that file kind.");
  }
}

export async function presignForUser(user: ApiUser, input: PresignInput) {
  assertCanUpload(user, input);

  const file = await prisma.orderFile.create({
    data: {
      key: "",
      filename: input.filename,
      mime: input.mime,
      size: input.size,
      kind: input.kind,
      uploadedById: user.id,
    },
    select: { id: true },
  });

  const key = buildStorageKey({
    orderId: "pending",
    kind: input.kind,
    fileId: file.id,
    filename: input.filename,
  });

  await prisma.orderFile.update({ where: { id: file.id }, data: { key } });

  const presign = await presignUpload({ key, mime: input.mime, sizeBytes: input.size });

  return {
    fileId: file.id,
    url: presign.uploadUrl,
    method: presign.method,
    expiresIn: FILE_LIMITS.presignTtlSeconds,
  };
}

type ConfirmInput = {
  fileId: string;
};

/** Marks the file uploaded after the client PUT it to the upload URL. */
export async function confirmUpload(user: ApiUser, input: ConfirmInput) {
  const file = await prisma.orderFile.findUnique({ where: { id: input.fileId } });

  if (!file) throw ApiError.notFound("File not found.");
  if (file.uploadedById !== user.id) throw ApiError.notFound();
  if (file.confirmedAt) return file; // idempotent

  if (!(await keyExists(file.key))) {
    throw ApiError.badRequest("Upload not found. Please try again.");
  }

  return prisma.orderFile.update({
    where: { id: file.id },
    data: { confirmedAt: new Date() },
  });
}

async function keyExists(key: string): Promise<boolean> {
  const object = await getObject(key);
  return object !== null;
}

/**
 * Deletes an unconfirmed or client file (own files only, only before the
 * order is submitted — enforced by callers via order status checks).
 */
export async function deleteOwnFile(user: ApiUser, fileId: string) {
  const file = await prisma.orderFile.findUnique({ where: { id: fileId } });

  if (!file || file.uploadedById !== user.id) throw ApiError.notFound();
  if (file.orderId) throw ApiError.forbidden("This file is attached to an order.");

  await deleteObject(file.key);
  await prisma.orderFile.delete({ where: { id: file.id } });
}

export async function getFileForUser(user: ApiUser, fileId: string) {
  const file = await prisma.orderFile.findUnique({
    where: { id: fileId },
    include: { order: { select: { id: true, userId: true, finalPaymentVerified: true } } },
  });

  if (!file) throw ApiError.notFound();

  const isOwner = file.uploadedById === user.id;
  const isOrderOwner = file.order?.userId === user.id;
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isAdmin && !isOwner && !isOrderOwner) {
    // Hide the existence of other users' resources (AGENTS.md, Security Rules).
    throw ApiError.notFound();
  }

  return file;
}
