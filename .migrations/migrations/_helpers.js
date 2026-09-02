import { readFile, uploadFiles } from '@directus/sdk';
import { existsSync } from 'fs';
import { readFile as fsReadFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Cache by requested fileId so multiple callers (project_logo, public_foreground, etc.)
// don't trigger duplicate uploads within the same migrate run.
const uploadedIdCache = new Map();

export function getRepoRootDir() {
  // .migrations/migrations/<file>.js -> repo root
  return fileURLToPath(new URL('../..', import.meta.url));
}

export function getLocalUploadPath(fileId, ext = 'svg') {
  const repoRoot = getRepoRootDir();
  return path.join(repoRoot, 'directus', 'uploads', `${fileId}.${ext}`);
}

export async function ensureUploadedFileId(client, fileId, opts = {}) {
  const { ext = 'svg', mime = 'image/svg+xml' } = opts;

  if (uploadedIdCache.has(fileId)) return uploadedIdCache.get(fileId);

  // If the file record exists in Directus, just use the provided id.
  try {
    await client.request(readFile(fileId));
    uploadedIdCache.set(fileId, fileId);
    return fileId;
  } catch {
    // Not in DB (common after resets) — upload from local uploads folder.
  }

  // Dedupe: if Directus already has this file uploaded (same original filename),
  // reuse that record instead of uploading again.
  //
  // When we upload `directus/uploads/<id>.svg`, Directus stores the original name
  // as filename_download = "<id>.svg".
  const expectedFilename = `${fileId}.${ext}`;
  try {
    const filesRes = await client.request(() => ({
      path: '/files',
      method: 'GET',
      params: {
        filter: { filename_download: { _eq: expectedFilename } },
        limit: 1,
        fields: ['id', 'filename_download'],
      },
    }));
    const existing = filesRes?.data?.[0] ?? null;
    if (existing?.id) {
      uploadedIdCache.set(fileId, existing.id);
      return existing.id;
    }
  } catch {
    // If /files isn't readable with current permissions, we'll fall back to uploading.
  }

  const localPath = getLocalUploadPath(fileId, ext);
  if (!existsSync(localPath)) {
    throw new Error(
      `Local upload file not found at "${localPath}". Add it under directus/uploads and rerun migrations.`,
    );
  }

  console.warn(`Uploading missing file to Directus: ${localPath}`);

  // Node 22 has a global FormData implementation; Directus SDK expects multipart FormData.
  const form = new FormData();
  const buf = await fsReadFile(localPath);
  // undici FormData expects a Blob as the second argument.
  const blob = new Blob([buf], { type: mime });
  form.append('file', blob, path.basename(localPath));

  const uploaded = await client.request(uploadFiles(form));
  const uploadedFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  const uploadedId = uploadedFile?.id;

  if (!uploadedId) {
    throw new Error(`uploadFiles() did not return an uploaded file id for "${fileId}".`);
  }

  uploadedIdCache.set(fileId, uploadedId);
  return uploadedId;
}

export async function ensureUploadedFileFromLocalFilename(client, filename, opts = {}) {
  const { mime = 'image/svg+xml' } = opts;

  // Reuse existing directus_files record by original download name.
  try {
    const filesRes = await client.request(() => ({
      path: '/files',
      method: 'GET',
      params: {
        filter: { filename_download: { _eq: filename } },
        limit: 1,
        fields: ['id', 'filename_download'],
      },
    }));
    const existing = filesRes?.data?.[0] ?? null;
    if (existing?.id) return existing.id;
  } catch {
    // ignore
  }

  const repoRoot = getRepoRootDir();
  const localPath = path.join(repoRoot, 'directus', 'uploads', filename);
  if (!existsSync(localPath)) {
    throw new Error(`Local upload file not found at "${localPath}".`);
  }

  console.warn(`Uploading missing file to Directus: ${localPath}`);
  const form = new FormData();
  const buf = await fsReadFile(localPath);
  const blob = new Blob([buf], { type: mime });
  form.append('file', blob, filename);

  const uploaded = await client.request(uploadFiles(form));
  const uploadedFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  const uploadedId = uploadedFile?.id;
  if (!uploadedId) throw new Error(`uploadFiles() did not return an uploaded file id for "${filename}".`);
  return uploadedId;
}

