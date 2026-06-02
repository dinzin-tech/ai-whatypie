import path from 'path';

/** Normalize slashes and extract a public web path under /uploads/. */
export function toWebUploadPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return '';

  const normalized = filePath.replace(/\\/g, '/');
  const uploadsIdx = normalized.indexOf('/uploads/');
  if (uploadsIdx !== -1) {
    return normalized.slice(uploadsIdx);
  }

  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`;
  }

  const base = path.basename(normalized);
  return base ? `/uploads/attachments/${base}` : '';
}

export function normalizeUploadPath(value) {
  if (!value || typeof value !== 'string') return value;
  if (/^https?:\/\//i.test(value)) return value;
  return toWebUploadPath(value) || value.replace(/\\/g, '/');
}
