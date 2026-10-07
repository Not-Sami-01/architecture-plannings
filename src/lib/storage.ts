import "server-only";

import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

import {config} from "@/config/config";
import {FILE_LIMITS} from "@/config/constants";

/**
 * Private-bucket storage (FR-15/FR-16). The DB stores keys only; downloads
 * go through the authorized route which issues 60s signed URLs.
 *
 * Backend selection:
 * - S3/R2 when STORAGE_* env vars are set (R2 works via its S3 endpoint).
 * - Local filesystem fallback for development without storage credentials.
 *   Files go to .storage/ (gitignored); the API surface is identical, so the
 *   switch to a real bucket needs no code changes elsewhere.
 */

const LOCAL_ROOT = ".storage";

export const isS3Storage = Boolean(
  config.storage.endpoint && config.storage.accessKeyId && config.storage.secretAccessKey
);

const s3 = isS3Storage
  ? new S3Client({
      region: config.storage.region,
      endpoint: config.storage.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.storage.accessKeyId!,
        secretAccessKey: config.storage.secretAccessKey!,
      },
    })
  : null;

/** Builds the storage key for an order file. Keys never leave the server. */
export function buildStorageKey(input: {orderId: string; kind: string; fileId: string; filename: string}) {
  const safe = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  return `orders/${input.orderId}/${input.kind.toLowerCase()}/${input.fileId}-${safe}`;
}

export type PresignResult = {uploadUrl: string; method: "PUT" | "LOCAL"};

/** Returns a short-lived upload URL the client PUTs the file to directly. */
export async function presignUpload(input: {
  key: string;
  mime: string;
  sizeBytes: number;
}): Promise<PresignResult> {
  if (s3) {
    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: input.key,
      ContentType: input.mime,
      ContentLength: input.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(s3, command, {expiresIn: FILE_LIMITS.presignTtlSeconds});
    return {uploadUrl, method: "PUT"};
  }

  // Local fallback: an upload URL on our own API (handled by /api/files/local-upload).
  const params = new URLSearchParams({key: input.key, expires: String(Date.now() + FILE_LIMITS.presignTtlSeconds * 1000)});
  return {uploadUrl: `/api/files/local-upload?${params.toString()}`, method: "LOCAL"};
}

/** Returns a short-lived read URL. Local backend streams through our API. */
export async function presignDownload(key: string, ttlSeconds: number): Promise<string> {
  if (s3) {
    const {GetObjectCommand} = await import("@aws-sdk/client-s3");
    return getSignedUrl(s3, new GetObjectCommand({Bucket: config.storage.bucket, Key: key}), {
      expiresIn: ttlSeconds,
    });
  }
  const params = new URLSearchParams({key, expires: String(Date.now() + ttlSeconds * 1000)});
  return `/api/files/local-download?${params.toString()}`;
}

/** Persists a body buffer (local backend only) — never called for S3. */
export async function putLocalObject(key: string, body: Buffer): Promise<void> {
  if (s3) throw new Error("putLocalObject is not available when S3 storage is configured");
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const target = path.join(LOCAL_ROOT, key);
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, body);
}

/** Streams an object for the authorized download route. */
export async function getObject(key: string): Promise<{body: ReadableStream<Uint8Array>; size?: number; mime?: string} | null> {
  if (s3) {
    const {GetObjectCommand} = await import("@aws-sdk/client-s3");
    const result = await s3.send(new GetObjectCommand({Bucket: config.storage.bucket, Key: key}));
    if (!result.Body) return null;
    return {body: result.Body as ReadableStream<Uint8Array>, size: result.ContentLength, mime: result.ContentType};
  }

  try {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile(`${LOCAL_ROOT}/${key}`);
    return {
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(body));
          controller.close();
        },
      }),
      size: body.byteLength,
    };
  } catch {
    return null;
  }
}

/** Removes an object (used when a client deletes an unsubmitted file). */
export async function deleteObject(key: string): Promise<void> {
  if (s3) {
    const {DeleteObjectCommand} = await import("@aws-sdk/client-s3");
    await s3.send(new DeleteObjectCommand({Bucket: config.storage.bucket, Key: key}));
    return;
  }
  try {
    const fs = await import("node:fs/promises");
    await fs.unlink(`${LOCAL_ROOT}/${key}`);
  } catch {
    // Already gone.
  }
}
