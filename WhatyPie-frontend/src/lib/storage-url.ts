const PLACEHOLDER_STORAGE_PATTERNS = [
  /your-backend-domain/i,
  /your-api-domain/i,
  /example\.com/i,
  /localhost:3000/i,
  /localhost:3001/i,
];

function normalizeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function isUsableStorageUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return false;
    return !PLACEHOLDER_STORAGE_PATTERNS.some((pattern) => pattern.test(parsed.hostname + parsed.href));
  } catch {
    return false;
  }
}

/** Public origin for /uploads/* (API host, not /api). */
export function resolveStorageBaseUrl(): string {
  const storage = process.env.NEXT_PUBLIC_STORAGE_URL?.trim() || "";
  if (isUsableStorageUrl(storage)) {
    return normalizeTrailingSlash(storage);
  }

  const api = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  if (api) {
    const derived = api.replace(/\/api\/?$/i, "");
    if (derived) {
      return normalizeTrailingSlash(derived);
    }
  }

  return "http://localhost:5000/";
}

/** Same-origin BFF path for browser upload assets. */
export function resolveUploadsUrl(uploadPath: string): string {
  const normalized = uploadPath.replace(/\\/g, "/").trim();
  const uploadsIdx = normalized.indexOf("/uploads/");
  const path =
    uploadsIdx >= 0 ? normalized.slice(uploadsIdx) : normalized.startsWith("/") ? normalized : `/${normalized}`;

  if (!path.startsWith("/uploads/")) {
    return path;
  }

  if (typeof window !== "undefined") {
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
    return `${apiBase}${path}`;
  }

  const base = resolveStorageBaseUrl();
  return `${base}${path.replace(/^\//, "")}`;
}
