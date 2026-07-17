import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const MAX_MEDIA_SIZE = 5 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export function mediaStorageRoot() {
  return path.join(process.cwd(), "storage", "media");
}

function resolveMediaStoragePath(storagePath: string) {
  const root = path.resolve(mediaStorageRoot());
  const candidate = path.resolve(
    path.isAbsolute(storagePath) ? storagePath : path.join(root, storagePath),
  );

  if (candidate === root || !candidate.startsWith(`${root}${path.sep}`)) {
    return null;
  }

  return candidate;
}

function mediaStorageCandidates(storagePath: string, fileName: string) {
  const candidates = new Set<string>();

  if (storagePath) {
    const candidate = resolveMediaStoragePath(storagePath);
    if (candidate) {
      candidates.add(candidate);
    }
  }

  if (fileName) {
    const candidate = resolveMediaStoragePath(fileName);
    if (candidate) {
      candidates.add(candidate);
    }
  }

  return Array.from(candidates);
}

export async function readMediaFile(input: {
  fileName: string;
  storagePath: string;
  fileData?: Buffer | Uint8Array | null;
}) {
  for (const candidate of mediaStorageCandidates(input.storagePath, input.fileName)) {
    try {
      return await readFile(candidate);
    } catch {
      // Try the next known storage location. Older media records may contain
      // an absolute path from a different server.
    }
  }

  if (input.fileData) {
    return Buffer.from(input.fileData);
  }

  return null;
}

export async function deleteMediaFile(input: {
  fileName: string;
  storagePath: string;
}) {
  await Promise.all(
    mediaStorageCandidates(input.storagePath, input.fileName).map(async (candidate) => {
      try {
        await unlink(candidate);
      } catch {
        // The database record is the source of truth. Missing legacy files are
        // expected when media was uploaded before database-backed storage.
      }
    }),
  );
}

export function validateMediaFile(file: File) {
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    return "Only PNG, JPG, WebP, GIF, ICO, MP4, WebM, and MOV media files are allowed.";
  }

  if (file.size > MAX_MEDIA_SIZE) {
    return "Media files must be 5MB or smaller.";
  }

  return null;
}

export async function saveMediaFile(input: {
  file: File;
  altText?: string | null;
  createdById?: string;
}) {
  const error = validateMediaFile(input.file);

  if (error) {
    throw new Error(error);
  }

  const id = randomUUID();
  const safeName = safeFileName(input.file.name);
  const fileName = `${id}-${safeName}`;
  const root = mediaStorageRoot();
  const storagePath = path.join(root, fileName);
  const bytes = Buffer.from(await input.file.arrayBuffer());

  await mkdir(root, { recursive: true });
  await writeFile(storagePath, bytes);

  return prisma.mediaAsset.create({
    data: {
      id,
      fileName,
      originalName: input.file.name,
      mimeType: input.file.type,
      size: input.file.size,
      fileData: bytes,
      storagePath: fileName,
      publicPath: `/media/${id}`,
      altText: input.altText?.trim() || null,
      createdById: input.createdById,
    },
  });
}

function safeFileName(fileName: string) {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");

  return `${base || "media"}${ext}`;
}
